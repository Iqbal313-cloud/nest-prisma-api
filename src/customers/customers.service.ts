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
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  private async invalidateCustomerCache() {
    await this.redis.deleteByPattern('customers:list:*');
  }

  async create(createCustomerDto: CreateCustomerDto) {
    const customer = await this.prisma.customer.create({
      data: { ...createCustomerDto },
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
    } = customerFilterDto;

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

    const where: Prisma.CustomerWhereInput = {
      ...(firstName && {
        firstName: { contains: firstName, mode: 'insensitive' },
      }),
      ...(lastName && {
        lastName: { contains: lastName, mode: 'insensitive' },
      }),
      ...(phoneNumber && {
        phoneNumber: { contains: phoneNumber },
      }),
      ...(address && {
        address: { contains: address, mode: 'insensitive' },
      }),
      ...(orderStatus && {
        orders: { some: { orderStatus } },
      }),
    };

    const [total, customers] = await Promise.all([
      this.prisma.customer.count({ where }),
      this.prisma.customer.findMany({
        relationLoadStrategy: 'query',
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phoneNumber: true,
          address: true,
          createdAt: true,
          updatedAt: true,
          orders: {
            ...(orderStatus && { where: { orderStatus } }),
            select: {
              id: true,
              orderStatus: true,
              orderDate: true,
            },
            orderBy: { createdAt: 'desc' },
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

  async update(id: number, updateCustomerDto: UpdateCustomerDto) {
    const existingCustomer = await this.prisma.customer.findUnique({
      where: { id },
    });

    if (!existingCustomer) {
      throw new NotFoundException(`Customer with id ${id} not found`);
    }

    const customer = await this.prisma.customer.update({
      where: { id },
      data: updateCustomerDto,
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

    await this.prisma.customer.delete({
      where: { id },
    });

    await this.invalidateCustomerCache();

    return {
      message: `Customer with id ${id} deleted successfully`,
    };
  }
}
