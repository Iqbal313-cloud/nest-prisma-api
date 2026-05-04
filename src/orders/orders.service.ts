import { Injectable } from '@nestjs/common';
import { Prisma } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateOrderDto } from './dto/createOrder.dto';
import { OrdersMapper } from './dto/orders.mapper';

// import { CreateOrderDto } from './dto/create-order.dto';
// import { UpdateOrderDto } from './dto/update-order.dto';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}
  async findAll(params: {
    page?: number;
    limit?: number;
    where?: Prisma.OrdersWhereInput;
    orderBy?: Prisma.OrdersOrderByWithRelationInput;
  }): Promise<{
    data: any[];
    meta: {
      total: number;
      page: number;
      lastPage: number;
      limit: number;
    };
  }> {
    const { page = 1, limit = 10, where, orderBy } = params;

    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      this.prisma.orders.findMany({
        skip,
        take: limit,
        where,
        orderBy: orderBy ?? { createdAt: 'desc' },
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
      this.prisma.orders.count({ where }),
    ]);

    // Transform response (flatten productName)
    const data = orders.map((order) => ({
      ...order,
      orderDetails: order.orderDetails.map((od) => ({
        quantity: od.quantity,
        unitPrice: od.unitPrice,
        discount: od.discount,
        productName: od.product.productName,
      })),
    }));

    return {
      data,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
        limit,
      },
    };
  }

  async findOneById(id: number) {
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
      return null;
    }

    return OrdersMapper.toOrderResponse(order);

    // // ✅ calculate total
    // const totalAmount = order.orderDetails.reduce((sum, od) => {
    //   const unitPrice = Number(od.unitPrice);
    //   const discount = Number(od.discount);

    //   return sum + od.quantity * unitPrice * (1 - discount);
    // }, 0);

    // // ✅ transform response
    // return {
    //   ...order,
    //   totalAmount: Number(totalAmount.toFixed(2)), // rounding (important!)
    //   orderDetails: order.orderDetails.map((od) => ({
    //     quantity: od.quantity,
    //     unitPrice: od.unitPrice,
    //     discount: od.discount,
    //     productName: od.product.productName,
    //   })),
    // };
  }

  async create(dto: CreateOrderDto) {
    const { orderDate, orderStatus, customerId, employeeId, orderDetails } =
      dto;

    const order = await this.prisma.orders.create({
      data: {
        orderDate: orderDate ?? new Date(),
        orderStatus: orderStatus ?? 'PENDING',

        customer: customerId ? { connect: { id: customerId } } : undefined,

        employee: employeeId ? { connect: { id: employeeId } } : undefined,

        orderDetails: {
          create: orderDetails.map((item) => ({
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount,

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
      },
    });

    // ✅ calculate total
    const totalAmount = order.orderDetails.reduce((sum, od) => {
      const unitPrice = Number(od.unitPrice);
      const discount = Number(od.discount);

      return sum + od.quantity * unitPrice * (1 - discount);
    }, 0);

    // ✅ transform response
    return {
      ...order,
      totalAmount: Number(totalAmount.toFixed(2)),
      orderDetails: order.orderDetails.map((od) => ({
        quantity: od.quantity,
        unitPrice: od.unitPrice,
        discount: od.discount,
        productName: od.product.productName,
      })),
    };
  }

  async update(id: number, dto: CreateOrderDto) {
    const { orderDate, orderStatus, customerId, employeeId, orderDetails } =
      dto;

    // 1. Update main order + replace details
    const updatedOrder = await this.prisma.orders.update({
      where: { id },
      data: {
        orderDate: orderDate ?? new Date(),
        orderStatus: orderStatus ?? undefined,

        customer: customerId ? { connect: { id: customerId } } : undefined,
        employee: employeeId ? { connect: { id: employeeId } } : undefined,

        //Replace all existing orderDetails (safe & simple approach)
        orderDetails: orderDetails
          ? {
              deleteMany: {}, // remove old items

              create: orderDetails.map((item) => ({
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                discount: item.discount,

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
      },
    });

    // 2. Calculate total
    const totalAmount = updatedOrder.orderDetails.reduce((sum, od) => {
      const unitPrice = Number(od.unitPrice);
      const discount = Number(od.discount);

      return sum + od.quantity * unitPrice * (1 - discount);
    }, 0);

    // 3. Transform response
    return {
      ...updatedOrder,
      totalAmount: Number(totalAmount.toFixed(2)),
      orderDetails: updatedOrder.orderDetails.map((od) => ({
        quantity: od.quantity,
        unitPrice: od.unitPrice,
        discount: od.discount,
        productName: od.product.productName,
      })),
    };
  }

  async remove(id: number) {
    const deletedOrder = await this.prisma.orders.delete({
      where: { id },
    });

    return {
      message: 'Order deleted successfully',
      data: deletedOrder,
    };
  }
}
