import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from 'src/generated/prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

import { FindOrdersDto } from './dto/find-orders.dto';
import { CreateOrderDto } from './dto/createOrder.dto';
import { OrdersMapper } from './dto/orders.mapper';
import { UpdateOrderDto } from './dto/updateOrder.dto';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  // =========================================================
  // FIND ALL
  // =========================================================

  async findAll(params: FindOrdersDto) {
    const start = performance.now();

    const {
      page = 1,
      limit = 10,
      search,
      orderStatus,
      customerId,
      employeeId,
      customerName,
      customerPhone,
      employeeName,
      productName,
      fromDate,
      toDate,
    } = params;

    // =========================================================
    // Cache key
    // =========================================================

    const cacheParams = {
      page,
      limit,
      search: search || null,
      orderStatus: orderStatus || null,
      customerId: customerId || null,
      employeeId: employeeId || null,
      customerName: customerName || null,
      customerPhone: customerPhone || null,
      employeeName: employeeName || null,
      productName: productName || null,
      fromDate: fromDate || null,
      toDate: toDate || null,
    };

    const cacheKey = `orders:list:${JSON.stringify(cacheParams)}`;

    // =========================================================
    // Redis cache
    // =========================================================

    const cached = await this.redis.get(cacheKey);

    if (cached !== null) {
      const end = performance.now();

      console.log(`Redis CACHE HIT: ${cacheKey}`);

      console.log({
        cache: 'HIT',
        totalTime: `${(end - start).toFixed(2)}ms`,
      });

      return cached;
    }

    console.log(`Redis CACHE MISS: ${cacheKey}`);

    // =========================================================
    // Pagination
    // =========================================================

    const skip = (page - 1) * limit;

    // =========================================================
    // WHERE
    // =========================================================

    const where: Prisma.OrdersWhereInput = {
      ...(orderStatus && {
        orderStatus,
      }),

      ...(customerId && {
        customerId,
      }),

      ...(employeeId && {
        employeeId,
      }),

      // =======================================================
      // Customer filters
      // =======================================================

      ...(customerName && {
        customer: {
          OR: [
            {
              firstName: {
                contains: customerName,
                mode: 'insensitive',
              },
            },
            {
              lastName: {
                contains: customerName,
                mode: 'insensitive',
              },
            },
          ],
        },
      }),

      ...(customerPhone && {
        customer: {
          phoneNumber: {
            contains: customerPhone,
          },
        },
      }),

      // =======================================================
      // Employee filter
      // =======================================================

      ...(employeeName && {
        employee: {
          OR: [
            {
              firstName: {
                contains: employeeName,
                mode: 'insensitive',
              },
            },
            {
              lastName: {
                contains: employeeName,
                mode: 'insensitive',
              },
            },
          ],
        },
      }),

      // =======================================================
      // Product filter
      // =======================================================

      ...(productName && {
        orderDetails: {
          some: {
            product: {
              productName: {
                contains: productName,
                mode: 'insensitive',
              },
            },
          },
        },
      }),

      // =======================================================
      // Date filter
      // =======================================================

      ...(fromDate || toDate
        ? {
            orderDate: {
              ...(fromDate && {
                gte: new Date(fromDate),
              }),

              ...(toDate && {
                lte: new Date(toDate),
              }),
            },
          }
        : {}),

      // =======================================================
      // Global search
      // =======================================================

      ...(search && {
        OR: [
          {
            customer: {
              OR: [
                {
                  firstName: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
                {
                  lastName: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
                {
                  phoneNumber: {
                    contains: search,
                  },
                },
              ],
            },
          },

          {
            employee: {
              OR: [
                {
                  firstName: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
                {
                  lastName: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
              ],
            },
          },

          {
            orderDetails: {
              some: {
                product: {
                  productName: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
              },
            },
          },
        ],
      }),
    };

    // =========================================================
    // Database queries
    // =========================================================

    const [orders, total] = await Promise.all([
      this.prisma.orders.findMany({
        skip,
        take: limit,

        where,

        orderBy: {
          createdAt: 'desc',
        },

        select: {
          id: true,
          orderDate: true,
          orderStatus: true,

          customer: {
            select: {
              firstName: true,
              lastName: true,
              phoneNumber: true,
              address: true,
            },
          },

          employee: {
            select: {
              firstName: true,
              lastName: true,
            },
          },

          orderDetails: {
            select: {
              quantity: true,
              unitPrice: true,
              discount: true,

              product: {
                select: {
                  productName: true,
                },
              },
            },
          },
        },
      }),

      this.prisma.orders.count({
        where,
      }),
    ]);

    const queryEnd = performance.now();

    // =========================================================
    // Transform
    // =========================================================

    const data = orders.map((order) => ({
      ...order,

      orderDetails: order.orderDetails.map((od) => ({
        quantity: od.quantity,
        unitPrice: Number(Number(od.unitPrice).toFixed(2)),
        discount: Number((Number(od.discount) * 100).toFixed(2)),
        productName: od.product.productName,
      })),
    }));

    const response = {
      data,

      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
        limit,
      },
    };

    const end = performance.now();

    console.log({
      cache: 'MISS',
      queryTime: `${(queryEnd - start).toFixed(2)}ms`,
      transformTime: `${(end - queryEnd).toFixed(2)}ms`,
      totalTime: `${(end - start).toFixed(2)}ms`,
    });

    // =========================================================
    // Save Redis cache
    // =========================================================

    await this.redis.set(cacheKey, response, 300);

    return response;
  }

  // =========================================================
  // FIND ONE
  // =========================================================

  async findOneById(id: number) {
    const cacheKey = `order:${id}`;

    // =========================================================
    // Redis
    // =========================================================

    const cached = await this.redis.get(cacheKey);

    if (cached) {
      console.log(`Redis CACHE HIT: ${cacheKey}`);

      return cached;
    }

    console.log(`Redis CACHE MISS: ${cacheKey}`);

    // =========================================================
    // Database
    // =========================================================

    const order = await this.prisma.orders.findUnique({
      where: { id },

      select: {
        id: true,
        orderDate: true,
        orderStatus: true,

        customer: {
          select: {
            firstName: true,
            lastName: true,
            phoneNumber: true,
            address: true,
          },
        },

        employee: {
          select: {
            firstName: true,
            lastName: true,
          },
        },

        orderDetails: {
          include: {
            product: {
              select: {
                productName: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      console.log(`Order not found: ${id}`);

      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    // =========================================================
    // Transform
    // =========================================================

    const response = OrdersMapper.toOrderResponse(order);

    // =========================================================
    // Save Redis
    // =========================================================

    await this.redis.set(
      cacheKey,
      response,
      30, // 5 minutes
    );

    return response;
  }

  // =========================================================
  // CREATE
  // =========================================================

  async create(dto: CreateOrderDto) {
    const { orderDate, orderStatus, customerId, employeeId, orderDetails } =
      dto;

    const order = await this.prisma.orders.create({
      data: {
        orderDate: orderDate ?? new Date(),

        orderStatus: orderStatus ?? 'PENDING',

        customer: customerId
          ? {
              connect: {
                id: customerId,
              },
            }
          : undefined,

        employee: employeeId
          ? {
              connect: {
                id: employeeId,
              },
            }
          : undefined,

        orderDetails: {
          create: orderDetails.map((item) => ({
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount,

            product: {
              connect: {
                id: item.productId,
              },
            },
          })),
        },
      },

      include: {
        customer: true,

        employee: true,

        orderDetails: {
          include: {
            product: {
              select: {
                productName: true,
              },
            },
          },
        },
      },
    });

    // =========================================================
    // Calculate total
    // =========================================================

    const totalAmount = order.orderDetails.reduce((sum, od) => {
      const unitPrice = Number(od.unitPrice);
      const discount = Number(od.discount);

      return sum + od.quantity * unitPrice * (1 - discount);
    }, 0);

    // =========================================================
    // Response
    // =========================================================

    const response = {
      ...order,

      totalAmount: Number(totalAmount.toFixed(2)),

      orderDetails: order.orderDetails.map((od) => ({
        quantity: od.quantity,
        unitPrice: od.unitPrice,
        discount: od.discount,
        productName: od.product.productName,
      })),
    };

    // =========================================================
    // Invalidate order list cache
    // =========================================================

    console.log('========================================');
    console.log('REDIS CACHE INVALIDATION');
    console.log('Deleting order list caches:', 'orders:list:*');

    await this.redis.deleteByPattern('orders:list:*');

    console.log('Redis cache invalidation completed');
    console.log('========================================');

    return response;
  }

  // =========================================================
  // UPDATE
  // =========================================================

  async update(id: number, dto: UpdateOrderDto) {
    console.log('========================================');
    console.log('PATCH UPDATE CALLED');
    console.log('ID:', id);
    console.log('DTO:', JSON.stringify(dto, null, 2));
    console.log('========================================');
    const { orderDate, orderStatus, customerId, employeeId, orderDetails } =
      dto;

    // =========================================================
    // Update order + replace order details
    // =========================================================

    const updatedOrder = await this.prisma.orders.update({
      where: {
        id,
      },

      data: {
        // PATCH হলে value না পাঠালে existing value থাকবে
        orderDate: orderDate ?? undefined,

        orderStatus: orderStatus ?? undefined,

        customer: customerId
          ? {
              connect: {
                id: customerId,
              },
            }
          : undefined,

        employee: employeeId
          ? {
              connect: {
                id: employeeId,
              },
            }
          : undefined,

        // =====================================================
        // Replace all existing order details
        // =====================================================

        orderDetails: orderDetails
          ? {
              deleteMany: {},

              create: orderDetails.map((item) => ({
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                discount: item.discount,

                product: {
                  connect: {
                    id: item.productId,
                  },
                },
              })),
            }
          : undefined,
      },

      include: {
        customer: true,

        employee: true,

        orderDetails: {
          include: {
            product: {
              select: {
                productName: true,
              },
            },
          },
        },
      },
    });

    // =========================================================
    // Calculate total
    // =========================================================

    const totalAmount = updatedOrder.orderDetails.reduce((sum, od) => {
      const unitPrice = Number(od.unitPrice);
      const discount = Number(od.discount);

      return sum + od.quantity * unitPrice * (1 - discount);
    }, 0);

    // =========================================================
    // Response
    // =========================================================

    const response = {
      ...updatedOrder,

      totalAmount: Number(totalAmount.toFixed(2)),

      orderDetails: updatedOrder.orderDetails.map((od) => ({
        quantity: od.quantity,
        unitPrice: od.unitPrice,
        discount: od.discount,
        productName: od.product.productName,
      })),
    };

    // =========================================================
    // Redis cache invalidation
    // =========================================================

    // =========================================================
    // Redis Cache Invalidation
    // =========================================================

    console.log('========================================');
    console.log('REDIS CACHE INVALIDATION');
    console.log('Order ID:', id);
    console.log('Deleting single order cache:', `order:${id}`);
    console.log('Deleting order list caches:', 'orders:list:*');

    await Promise.all([
      this.redis.del(`order:${id}`),
      this.redis.deleteByPattern('orders:list:*'),
    ]);

    console.log('Redis cache invalidation completed');
    console.log('========================================');

    return response;
  }

  // =========================================================
  // REMOVE
  // =========================================================

  async remove(id: number) {
    console.log('========================================');
    console.log('DELETE ORDER START');
    console.log('Order ID:', id);
    console.log('========================================');

    // =========================================================
    // Delete from Database
    // =========================================================

    const deletedOrder = await this.prisma.orders.delete({
      where: {
        id,
      },
    });

    console.log('========================================');
    console.log('DATABASE DELETE SUCCESS');
    console.log('Deleted Order ID:', deletedOrder.id);
    console.log('========================================');

    // =========================================================
    // Redis Cache Invalidation
    // =========================================================

    console.log('========================================');
    console.log('REDIS CACHE INVALIDATION');
    console.log('Deleting single order cache:', `order:${id}`);
    console.log('Deleting order list caches:', 'orders:list:*');

    await Promise.all([
      this.redis.del(`order:${id}`),
      this.redis.deleteByPattern('orders:list:*'),
    ]);

    console.log('Redis cache invalidation completed');
    console.log('========================================');

    return {
      message: 'Order deleted successfully',
      data: deletedOrder,
    };
  }
}
