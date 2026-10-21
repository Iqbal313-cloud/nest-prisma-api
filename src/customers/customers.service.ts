import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CustomerFilterDto } from './dto/customer-filter.dto';
import {
  getPagination,
  getPaginationMeta,
} from 'src/common/utils/pagination.util';

@Injectable()
export class CustomerService {
  constructor(private prisma: PrismaService) {}

  async findAll(customerFilterDto: CustomerFilterDto) {
    const {
      page = 1,
      limit = 10,
      firstName,
      lastName,
      phoneNumber,
      address,
      orderStatus,
    } = customerFilterDto;

    const pagination = getPagination(page, limit);

    const where = {
      ...(firstName && {
        firstName: {
          contains: firstName,
          mode: 'insensitive' as const,
        },
      }),

      ...(lastName && {
        lastName: {
          contains: lastName,
          mode: 'insensitive' as const,
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
          mode: 'insensitive' as const,
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

    const [total, data] = await Promise.all([
      this.prisma.customer.count({
        where,
      }),

      this.prisma.customer.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          orders: {
            ...(orderStatus && {
              where: {
                orderStatus,
              },
            }),
          },
        },
      }),
    ]);

    return {
      data,
      meta: getPaginationMeta(total, pagination.page, pagination.limit),
    };
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
