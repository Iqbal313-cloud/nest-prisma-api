import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from 'src/generated/prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

import { FindOrdersDto } from './dto/find-orders.dto';
import { OrdersMapper } from './dto/orders.mapper';
import {
  getPagination,
  getPaginationMeta,
} from 'src/common/utils/pagination.util';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/updateOrder.dto';
/* eslint-disable */
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
      orderId,
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
      createdByName,
      updatedByName,
    } = params;

    // =========================================================
    // Cache key
    // =========================================================

    const cacheParams = {
      orderId: orderId ?? null,
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
      createdByName: createdByName || null,
      updatedByName: updatedByName || null,
    };

    const cacheKey = `orders:list:v2:${JSON.stringify(cacheParams)}`;

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

    const pagination = getPagination(page, limit);

    // =========================================================
    // WHERE
    // =========================================================

    const where: Prisma.OrdersWhereInput = {
      // Order ID filter
      ...(orderId !== undefined && {
        id: orderId,
      }),

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

      ...(customerName || customerPhone
        ? {
            customer: {
              is: {
                ...(customerName && {
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
                }),

                ...(customerPhone && {
                  phoneNumber: {
                    contains: customerPhone,
                  },
                }),
              },
            },
          }
        : {}),

      // =======================================================
      // Employee filter
      // =======================================================

      ...(employeeName && {
        employee: {
          is: {
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
      // Created By filter
      // =======================================================

      ...(createdByName && {
        createdBy: {
          is: {
            name: {
              contains: createdByName,
              mode: 'insensitive',
            },
          },
        },
      }),

      // =======================================================
      // Updated By filter
      // =======================================================

      ...(updatedByName && {
        updatedBy: {
          is: {
            name: {
              contains: updatedByName,
              mode: 'insensitive',
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
                gte: new Date(`${fromDate}T00:00:00.000Z`),
              }),

              ...(toDate && {
                lt: new Date(
                  new Date(`${toDate}T00:00:00.000Z`).getTime() +
                    24 * 60 * 60 * 1000,
                ),
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
              is: {
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
          },

          {
            employee: {
              is: {
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
        relationLoadStrategy: 'query',

        skip: pagination.skip,
        take: pagination.take,

        where,

        orderBy: {
          createdAt: 'desc',
        },

        select: {
          id: true,
          orderDate: true,
          orderStatus: true,
          createdAt: true,
          updatedAt: true,

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

          createdBy: {
            select: {
              name: true,
            },
          },

          updatedBy: {
            select: {
              name: true,
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
        discount: Number(od.discount),
        productName: od.product.productName,
      })),
    }));

    const response = {
      data,
      meta: getPaginationMeta(total, pagination.page, pagination.limit),
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
        createdAt: true,
        updatedAt: true,

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

        createdBy: {
          select: {
            name: true,
          },
        },

        updatedBy: {
          select: {
            name: true,
          },
        },

        orderDetails: {
          select: {
            id: true,
            productId: true,
            quantity: true,
            unitPrice: true,
            discount: true,
            product: {
              select: {
                id: true,
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

  async create(dto: CreateOrderDto, userId: string) {
    const {
      customerFirstName,
      customerLastName,
      customerPhone,
      customerAddress,
      orderDate,
      orderStatus,
      employeeId,
      orderDetails,
    } = dto;

    const order = await this.prisma.$transaction(async (tx) => {
      // Existing customer খোঁজা — phone number exact match
      let customer = await tx.customer.findFirst({
        where: {
          phoneNumber: customerPhone,
        },
      });

      // Customer না থাকলে নতুন customer তৈরি
      if (!customer) {
        customer = await tx.customer.create({
          data: {
            firstName: customerFirstName,
            lastName: customerLastName ?? null,
            phoneNumber: customerPhone,
            address: customerAddress ?? null,
            createdBy: {
              connect: { id: userId },
            },
          },
        });
      }

      return tx.orders.create({
        data: {
          orderDate: orderDate ?? new Date(),
          orderStatus: orderStatus ?? 'PENDING',

          createdBy: {
            connect: { id: userId },
          },

          customer: {
            connect: { id: customer.id },
          },

          employee: employeeId ? { connect: { id: employeeId } } : undefined,

          orderDetails: {
            create: orderDetails.map((item) => ({
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              discount: item.discount ?? 0,
              product: {
                connect: { id: item.productId },
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
                select: { productName: true },
              },
            },
          },
          createdBy: {
            select: { name: true },
          },
          updatedBy: {
            select: { name: true },
          },
        },
      });
    });

    const totalAmount = order.orderDetails.reduce(
      (sum, item) =>
        sum +
        item.quantity *
          Number(item.unitPrice) *
          (1 - Number(item.discount) / 100),
      0,
    );

    await this.redis.deleteByPattern('orders:list:*');

    return {
      ...order,
      totalAmount: Number(totalAmount.toFixed(2)),
      orderDetails: order.orderDetails.map((item) => ({
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount,
        productName: item.product.productName,
      })),
    };
  }

  async update(id: number, dto: UpdateOrderDto, userId: string) {
    const {
      customerFirstName,
      customerLastName,
      customerPhone,
      customerAddress,
      orderDate,
      orderStatus,
      employeeId,
      orderDetails,
    } = dto;

    const updatedOrder = await this.prisma.$transaction(async (tx) => {
      const existingOrder = await tx.orders.findUniqueOrThrow({
        where: { id },
        include: { customer: true },
      });

      let customerUpdate: { connect: { id: number } } | undefined;

      if (customerPhone !== undefined) {
        // Phone match == existing customer
        let customer = await tx.customer.findFirst({
          where: {
            phoneNumber: customerPhone,
          },
        });

        if (!customer) {
          // new customer
          if (!customerFirstName?.trim()) {
            throw new Error(
              'Customer first name is required for a new phone number.',
            );
          }

          customer = await tx.customer.create({
            data: {
              firstName: customerFirstName,
              lastName: customerLastName ?? null,
              phoneNumber: customerPhone,
              address: customerAddress ?? null,
              createdBy: {
                connect: { id: userId },
              },
            },
          });
        }

        customerUpdate = {
          connect: { id: customer.id },
        };
      } else if (
        customerFirstName !== undefined ||
        customerLastName !== undefined ||
        customerAddress !== undefined
      ) {
        // existing customer information update
        if (existingOrder.customerId !== null) {
          await tx.customer.update({
            where: { id: existingOrder.customerId },
            data: {
              ...(customerFirstName !== undefined
                ? { firstName: customerFirstName }
                : {}),
              ...(customerLastName !== undefined
                ? { lastName: customerLastName }
                : {}),
              ...(customerAddress !== undefined
                ? { address: customerAddress }
                : {}),
              updatedById: userId,
            },
          });
        }
      }

      return tx.orders.update({
        where: { id },
        data: {
          orderDate: orderDate ?? undefined,
          orderStatus: orderStatus ?? undefined,
          customer: customerUpdate,

          employee: employeeId ? { connect: { id: employeeId } } : undefined,

          updatedBy: {
            connect: { id: userId },
          },

          orderDetails: orderDetails
            ? {
                deleteMany: {},
                create: orderDetails.map((item) => ({
                  quantity: item.quantity,
                  unitPrice: item.unitPrice,
                  discount: item.discount ?? 0,
                  product: {
                    connect: { id: item.productId },
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
                select: { productName: true },
              },
            },
          },
          createdBy: {
            select: { name: true },
          },
          updatedBy: {
            select: { name: true },
          },
        },
      });
    });

    const totalAmount = updatedOrder.orderDetails.reduce(
      (sum, item) =>
        sum +
        item.quantity *
          Number(item.unitPrice) *
          (1 - Number(item.discount) / 100),
      0,
    );

    await Promise.all([
      this.redis.del(`order:${id}`),
      this.redis.deleteByPattern('orders:list:*'),
    ]);

    return {
      ...updatedOrder,
      totalAmount: Number(totalAmount.toFixed(2)),
      orderDetails: updatedOrder.orderDetails.map((item) => ({
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount,
        productName: item.product.productName,
      })),
    };
  }
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
