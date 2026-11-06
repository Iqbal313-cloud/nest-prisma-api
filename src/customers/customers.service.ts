import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CustomerFilterDto } from './dto/customer-filter.dto';
import { Prisma } from 'src/generated/prisma/client';
import {
  getPagination,
  getPaginationMeta,
} from 'src/common/utils/pagination.util';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class CustomerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  private async invalidateCustomerCache() {
    await this.redis.deleteByPattern('customers:list:*');
  }

  async create(createCustomerDto: CreateCustomerDto, userId: string) {
    const customer = await this.prisma.customer.create({
      data: {
        ...createCustomerDto,
        createdById: userId,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
        updatedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    await this.invalidateCustomerCache();

    return customer;
  }

  async findAll(customerFilterDto: CustomerFilterDto) {
    const start = performance.now();

    const {
      page = 1,
      limit = 10,
      firstName,
      lastName,
      phoneNumber,
      address,
      orderStatus,
      createdByName,
      updatedByName,
    } = customerFilterDto;

    // Redis cache parameters
    const cacheParams = {
      page,
      limit,
      firstName: firstName || null,
      lastName: lastName || null,
      phoneNumber: phoneNumber || null,
      address: address || null,
      orderStatus: orderStatus || null,
      createdByName: createdByName || null,
      updatedByName: updatedByName || null,
    };

    const cacheKey = `customers:list:${JSON.stringify(cacheParams)}`;

    const cached = await this.redis.get(cacheKey);

    if (cached !== null) {
      const end = performance.now();

      console.log({
        cache: 'HIT',
        totalTime: `${(end - start).toFixed(2)}ms`,
      });

      return cached;
    }

    console.log(`Redis CACHE MISS: ${cacheKey}`);

    const pagination = getPagination(page, limit);

    // Build Prisma filters
    const where: Prisma.CustomerWhereInput = {
      ...(firstName && {
        firstName: {
          contains: firstName,
          mode: 'insensitive',
        },
      }),

      ...(lastName && {
        lastName: {
          contains: lastName,
          mode: 'insensitive',
        },
      }),

      ...(phoneNumber && {
        phoneNumber: {
          contains: phoneNumber,
        },
      }),

      ...(address && {
        address: {
          contains: address,
          mode: 'insensitive',
        },
      }),

      ...(orderStatus && {
        orders: {
          some: {
            orderStatus,
          },
        },
      }),

      // Filter by creator name
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

      // Filter by updater name
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
    };

    const [total, customers] = await Promise.all([
      this.prisma.customer.count({
        where,
      }),

      this.prisma.customer.findMany({
        relationLoadStrategy: 'query',
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phoneNumber: true,
          address: true,
          createdAt: true,
          updatedAt: true,

          // Audit information
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

          orders: {
            ...(orderStatus && {
              where: {
                orderStatus,
              },
            }),
            select: {
              id: true,
              orderStatus: true,
              orderDate: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
            take: 1,
          },
        },
      }),
    ]);

    const queryEnd = performance.now();

    const response = {
      data: customers,
      meta: getPaginationMeta(total, pagination.page, pagination.limit),
    };

    const end = performance.now();

    console.log({
      cache: 'MISS',
      queryTime: `${(queryEnd - start).toFixed(2)}ms`,
      transformTime: `${(end - queryEnd).toFixed(2)}ms`,
      totalTime: `${(end - start).toFixed(2)}ms`,
    });

    await this.redis.set(cacheKey, response, 300);

    return response;
  }

  async findOne(id: number) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
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
        orders: {
          include: {
            orderDetails: {
              include: { product: true },
            },
            employee: true,
          },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    return customer;
  }

  async update(
    id: number,
    updateCustomerDto: UpdateCustomerDto,
    userId: string,
  ) {
    const existingCustomer = await this.prisma.customer.findUnique({
      where: { id },
    });

    if (!existingCustomer) {
      throw new NotFoundException(`Customer with id ${id} not found`);
    }

    const customer = await this.prisma.customer.update({
      where: { id },
      data: {
        ...updateCustomerDto,
        updatedById: userId,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
        updatedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    await this.invalidateCustomerCache();

    return customer;
  }

  async remove(id: number) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with id ${id} not found`);
    }

    // Check whether this customer has any orders
    const orderCount = await this.prisma.orders.count({
      where: {
        customerId: id,
      },
    });

    if (orderCount > 0) {
      throw new ConflictException(
        `Cannot delete customer. This customer has ${orderCount} associated order(s).`,
      );
    }

    try {
      await this.prisma.customer.delete({
        where: { id },
      });
    } catch (error) {
      // Database-level protection against concurrent order creation
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new ConflictException(
          'Cannot delete customer because associated orders exist.',
        );
      }

      throw error;
    }

    await this.invalidateCustomerCache();

    return {
      message: `Customer with id ${id} deleted successfully`,
    };
  }
}
