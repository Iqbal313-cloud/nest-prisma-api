import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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

  // FIND ALL

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

  // FIND ONE

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

  // CREATE

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

    console.log('[ORDER CREATE] Started:', {
      userId,
      productCount: orderDetails.length,
      products: orderDetails.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
    });

    const order = await this.prisma.$transaction(async (tx) => {
      try {
        // 1. Find or create customer
        let customer = await tx.customer.findFirst({
          where: {
            phoneNumber: customerPhone,
          },
        });

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

          console.log('[ORDER CREATE] Customer created:', {
            customerId: customer.id,
          });
        } else {
          console.log('[ORDER CREATE] Existing customer found:', {
            customerId: customer.id,
          });
        }

        // 2. Aggregate quantities by product ID
        // Handles duplicate product IDs in orderDetails.
        const stockRequirements = new Map<number, number>();

        for (const item of orderDetails) {
          const currentQuantity = stockRequirements.get(item.productId) ?? 0;

          stockRequirements.set(
            item.productId,
            currentQuantity + item.quantity,
          );
        }

        // 3. Atomically decrease stock

        const sortedStockRequirements = [...stockRequirements.entries()].sort(
          ([a], [b]) => a - b,
        );
        for (const [productId, requestedQuantity] of sortedStockRequirements) {
          console.log('[STOCK CREATE] Attempting stock deduction:', {
            productId,
            requestedQuantity,
          });

          const result = await tx.product.updateMany({
            where: {
              id: productId,
              unitsInStock: {
                gte: requestedQuantity,
              },
            },
            data: {
              unitsInStock: {
                decrement: requestedQuantity,
              },
            },
          });

          if (result.count !== 1) {
            const product = await tx.product.findUnique({
              where: { id: productId },
              select: {
                id: true,
                productName: true,
                unitsInStock: true,
              },
            });

            console.error('[STOCK CREATE] Stock deduction failed:', {
              productId,
              requestedQuantity,
              product,
              reason: !product
                ? 'PRODUCT_NOT_FOUND'
                : product.unitsInStock === null
                  ? 'STOCK_IS_NULL'
                  : 'INSUFFICIENT_STOCK',
            });

            if (!product) {
              throw new BadRequestException(
                `Product ID ${productId} not found.`,
              );
            }

            if (product.unitsInStock === null) {
              throw new BadRequestException(
                `${product.productName}: Stock information is unavailable.`,
              );
            }

            throw new BadRequestException(
              `${product.productName}: Insufficient stock. Available: ${product.unitsInStock}, Requested: ${requestedQuantity}.`,
            );
          }

          const updatedProduct = await tx.product.findUnique({
            where: { id: productId },
            select: {
              id: true,
              productName: true,
              unitsInStock: true,
            },
          });

          console.log('[STOCK CREATE] Stock deduction successful:', {
            productId,
            requestedQuantity,
            updatedProduct,
          });
        }

        // 4. Create order
        const createdOrder = await tx.orders.create({
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
                  select: {
                    productName: true,
                  },
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

        console.log('[ORDER CREATE] Order created inside transaction:', {
          orderId: createdOrder.id,
          orderDetailsCount: createdOrder.orderDetails.length,
        });

        return createdOrder;
      } catch (error) {
        console.error('[ORDER CREATE] Transaction failed:', {
          userId,
          error: error instanceof Error ? error.message : String(error),
        });

        throw error;
      }
    });

    // 5. Calculate total amount
    const totalAmount = order.orderDetails.reduce(
      (sum, item) =>
        sum +
        item.quantity *
          Number(item.unitPrice) *
          (1 - Number(item.discount) / 100),
      0,
    );

    // 6. Invalidate order list cache
    await this.redis.deleteByPattern('orders:list:*');

    console.log('[ORDER CREATE] Completed successfully:', {
      orderId: order.id,
      totalAmount: Number(totalAmount.toFixed(2)),
    });

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

  // UPDATE
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

    console.log('[ORDER UPDATE] Started:', {
      orderId: id,
      userId,
      orderDetailsProvided: orderDetails !== undefined,
      newProducts: orderDetails?.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
    });

    const updatedOrder = await this.prisma.$transaction(async (tx) => {
      try {
        // 1. Find existing order
        const existingOrder = await tx.orders.findUniqueOrThrow({
          where: { id },
          include: {
            customer: true,
            orderDetails: {
              select: {
                productId: true,
                quantity: true,
              },
            },
          },
        });

        console.log('[ORDER UPDATE] Existing order found:', {
          orderId: id,
          oldProducts: existingOrder.orderDetails,
        });

        let customerUpdate: { connect: { id: number } } | undefined;

        // 2. Customer update logic
        if (customerPhone !== undefined) {
          let customer = await tx.customer.findFirst({
            where: {
              phoneNumber: customerPhone,
            },
          });

          if (!customer) {
            if (!customerFirstName?.trim()) {
              throw new BadRequestException(
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

            console.log('[ORDER UPDATE] New customer created:', {
              customerId: customer.id,
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
          if (existingOrder.customerId !== null) {
            await tx.customer.update({
              where: {
                id: existingOrder.customerId,
              },
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

            console.log('[ORDER UPDATE] Customer information updated:', {
              customerId: existingOrder.customerId,
            });
          }
        }

        // 3. Adjust stock only when orderDetails is provided
        if (orderDetails !== undefined) {
          // Aggregate old quantities by product ID
          const oldStockMap = new Map<number, number>();

          for (const item of existingOrder.orderDetails) {
            oldStockMap.set(
              item.productId,
              (oldStockMap.get(item.productId) ?? 0) + item.quantity,
            );
          }

          // Aggregate new quantities by product ID
          const newStockMap = new Map<number, number>();

          for (const item of orderDetails) {
            newStockMap.set(
              item.productId,
              (newStockMap.get(item.productId) ?? 0) + item.quantity,
            );
          }

          // Get all affected product IDs
          const productIds = new Set([
            ...oldStockMap.keys(),
            ...newStockMap.keys(),
          ]);

          console.log('[STOCK UPDATE] Stock comparison:', {
            orderId: id,
            oldStock: Object.fromEntries(oldStockMap),
            newStock: Object.fromEntries(newStockMap),
          });

          // Apply net stock changes
          const sortedProductIds = [...productIds].sort((a, b) => a - b);

          for (const productId of sortedProductIds) {
            const oldQuantity = oldStockMap.get(productId) ?? 0;
            const newQuantity = newStockMap.get(productId) ?? 0;

            // Positive = restore stock
            // Negative = deduct additional stock
            const stockDifference = oldQuantity - newQuantity;

            if (stockDifference === 0) {
              console.log('[STOCK UPDATE] No stock change required:', {
                productId,
                oldQuantity,
                newQuantity,
              });

              continue;
            }

            console.log('[STOCK UPDATE] Applying stock adjustment:', {
              productId,
              oldQuantity,
              newQuantity,
              stockDifference,
              action: stockDifference > 0 ? 'RESTORE' : 'DEDUCT',
            });

            let result;

            if (stockDifference > 0) {
              // Restore stock
              result = await tx.product.updateMany({
                where: {
                  id: productId,
                  unitsInStock: {
                    not: null,
                  },
                },
                data: {
                  unitsInStock: {
                    increment: stockDifference,
                  },
                },
              });
            } else {
              // Deduct additional stock atomically
              const requestedQuantity = Math.abs(stockDifference);

              result = await tx.product.updateMany({
                where: {
                  id: productId,
                  unitsInStock: {
                    gte: requestedQuantity,
                  },
                },
                data: {
                  unitsInStock: {
                    decrement: requestedQuantity,
                  },
                },
              });
            }

            console.log('[STOCK UPDATE] Database update result:', {
              productId,
              result,
            });

            if (result.count !== 1) {
              const product = await tx.product.findUnique({
                where: { id: productId },
                select: {
                  id: true,
                  productName: true,
                  unitsInStock: true,
                },
              });

              console.error('[STOCK UPDATE] Stock adjustment failed:', {
                orderId: id,
                productId,
                oldQuantity,
                newQuantity,
                stockDifference,
                product,
                reason: !product
                  ? 'PRODUCT_NOT_FOUND'
                  : product.unitsInStock === null
                    ? 'STOCK_IS_NULL'
                    : 'INSUFFICIENT_STOCK',
              });

              if (!product) {
                throw new BadRequestException(
                  `Product ID ${productId} not found.`,
                );
              }

              if (product.unitsInStock === null) {
                throw new BadRequestException(
                  `${product.productName}: Stock information is unavailable.`,
                );
              }

              throw new BadRequestException(
                `${product.productName}: Insufficient stock. Available: ${product.unitsInStock}, Additional required: ${Math.abs(stockDifference)}.`,
              );
            }

            const updatedProduct = await tx.product.findUnique({
              where: { id: productId },
              select: {
                id: true,
                productName: true,
                unitsInStock: true,
              },
            });

            console.log('[STOCK UPDATE] Stock adjustment successful:', {
              productId,
              oldQuantity,
              newQuantity,
              updatedProduct,
            });
          }
        } else {
          console.log(
            '[STOCK UPDATE] Skipped: orderDetails was not provided.',
            { orderId: id },
          );
        }

        // 4. Update order
        const result = await tx.orders.update({
          where: { id },
          data: {
            orderDate: orderDate ?? undefined,
            orderStatus: orderStatus ?? undefined,

            customer: customerUpdate,

            employee: employeeId ? { connect: { id: employeeId } } : undefined,

            updatedBy: {
              connect: { id: userId },
            },

            orderDetails:
              orderDetails !== undefined
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
                  select: {
                    productName: true,
                  },
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

        console.log('[ORDER UPDATE] Order updated inside transaction:', {
          orderId: result.id,
          orderDetailsCount: result.orderDetails.length,
        });

        return result;
      } catch (error) {
        console.error('[ORDER UPDATE] Transaction failed:', {
          orderId: id,
          userId,
          error: error instanceof Error ? error.message : String(error),
        });

        throw error;
      }
    });

    // 5. Calculate total amount
    const totalAmount = updatedOrder.orderDetails.reduce(
      (sum, item) =>
        sum +
        item.quantity *
          Number(item.unitPrice) *
          (1 - Number(item.discount) / 100),
      0,
    );

    // 6. Invalidate Redis cache
    await Promise.all([
      this.redis.del(`order:${id}`),
      this.redis.deleteByPattern('orders:list:*'),
    ]);

    console.log('[ORDER UPDATE] Completed successfully:', {
      orderId: id,
      totalAmount: Number(totalAmount.toFixed(2)),
    });

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
