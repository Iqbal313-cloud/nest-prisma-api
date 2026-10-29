import { Injectable, NotFoundException } from '@nestjs/common';
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
    private prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  // async findAll(customerFilterDto: CustomerFilterDto) {
  //   const {
  //     page = 1,
  //     limit = 10,
  //     firstName,
  //     lastName,
  //     phoneNumber,
  //     address,
  //     orderStatus,
  //   } = customerFilterDto;

  //   const pagination = getPagination(page, limit);

  //   const where = {
  //     ...(firstName && {
  //       firstName: {
  //         contains: firstName,
  //         mode: 'insensitive' as const,
  //       },
  //     }),

  //     ...(lastName && {
  //       lastName: {
  //         contains: lastName,
  //         mode: 'insensitive' as const,
  //       },
  //     }),

  //     ...(phoneNumber && {
  //       phoneNumber: {
  //         contains: phoneNumber,
  //       },
  //     }),

  //     ...(address && {
  //       address: {
  //         contains: address,
  //         mode: 'insensitive' as const,
  //       },
  //     }),

  //     ...(orderStatus && {
  //       orders: {
  //         some: {
  //           orderStatus,
  //         },
  //       },
  //     }),
  //   };

  //   const [total, data] = await Promise.all([
  //     this.prisma.customer.count({
  //       where,
  //     }),

  //     this.prisma.customer.findMany({
  //       where,
  //       skip: pagination.skip,
  //       take: pagination.take,
  //       orderBy: {
  //         createdAt: 'desc',
  //       },
  //       include: {
  //         orders: {
  //           ...(orderStatus && {
  //             where: {
  //               orderStatus,
  //             },
  //           }),
  //         },
  //       },
  //     }),
  //   ]);

  //   return {
  //     data,
  //     meta: getPaginationMeta(total, pagination.page, pagination.limit),
  //   };
  // }

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
    } = customerFilterDto;

    // 1. Cache key
    const cacheParams = {
      page,
      limit,
      firstName: firstName || null,
      lastName: lastName || null,
      phoneNumber: phoneNumber || null,
      address: address || null,
      orderStatus: orderStatus || null,
    };

    const cacheKey = `customers:list:${JSON.stringify(cacheParams)}`;

    // 2. Redis cache
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

    // 3. Pagination
    const pagination = getPagination(page, limit);

    // 4. WHERE
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
    };

    // 5. Database queries
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

    // 6. Response
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

    // 7. Save Redis cache (5 minutes)
    await this.redis.set(cacheKey, response, 300);

    return response;
  }

  async findOne(id: number) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        orders: {
          include: {
            orderDetails: {
              include: {
                product: true, // optional but useful
              },
            },
            employee: true, // optional
          },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    return customer;
  }

  async create(createCustomerDto: CreateCustomerDto) {
    const customer = await this.prisma.customer.create({
      data: {
        ...createCustomerDto,
      },
    });

    return customer;
  }

  async update(id: number, updateCustomerDto: UpdateCustomerDto) {
    const existingCustomer = await this.prisma.customer.findUnique({
      where: { id },
    });

    if (!existingCustomer) {
      throw new NotFoundException(`Customer with id ${id} not found`);
    }

    return this.prisma.customer.update({
      where: { id },
      data: updateCustomerDto,
    });
  }

  async remove(id: number) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with id ${id} not found`);
    }

    await this.prisma.customer.delete({
      where: { id },
    });

    return {
      message: `Customer with id ${id} deleted successfully`,
    };
  }
}
