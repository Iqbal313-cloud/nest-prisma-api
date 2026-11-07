import { Injectable } from '@nestjs/common';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { EmployeeFilterDto } from './dto/employee-filter.dto';
import {
  getPagination,
  getPaginationMeta,
} from 'src/common/utils/pagination.util';

@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filterDto: EmployeeFilterDto) {
    const {
      page = 1,
      limit = 10,
      id,
      firstName,
      lastName,
      birthDate,
      orderId,
      orderDate,
      orderStatus,
      createdBy,
      updatedBy,
    } = filterDto;

    const pagination = getPagination(page, limit);

    const orderWhere = {
      ...(orderId && { id: orderId }),
      ...(orderDate && { orderDate }),
      ...(orderStatus && { orderStatus }),
    };

    const where = {
      ...(id && { id }),
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
      ...(birthDate && { birthDate }),

      ...(createdBy && {
        createdBy: {
          is: {
            name: {
              contains: createdBy,
              mode: 'insensitive' as const,
            },
          },
        },
      }),

      ...(updatedBy && {
        updatedBy: {
          is: {
            name: {
              contains: updatedBy,
              mode: 'insensitive' as const,
            },
          },
        },
      }),

      ...(Object.keys(orderWhere).length > 0 && {
        orders: {
          some: orderWhere,
        },
      }),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.employee.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,

        select: {
          id: true,
          firstName: true,
          lastName: true,
          birthDate: true,
          photoPath: true,
          notes: true,
          createdAt: true,
          updatedAt: true,
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
            where: orderWhere,
            select: {
              id: true,
              orderDate: true,
              orderStatus: true,
            },
          },

          _count: {
            select: {
              orders: {
                where: orderWhere,
              },
            },
          },
        },
      }),

      this.prisma.employee.count({ where }),
    ]);

    return {
      data,
      meta: getPaginationMeta(total, pagination.page, pagination.limit),
    };
  }

  async findOne(id: number) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        birthDate: true,
        photoPath: true,
        notes: true,
        createdAt: true,
        updatedAt: true,

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
          select: {
            id: true,
            orderDate: true,
            orderStatus: true,
          },
        },

        _count: {
          select: {
            orders: true,
          },
        },
      },
    });

    if (!employee) {
      throw new NotFoundException(`Employee with id ${id} not found`);
    }

    return {
      data: employee,
    };
  }

  async create(createEmployeeDto: CreateEmployeeDto, userId: string) {
    return this.prisma.employee.create({
      data: {
        firstName: createEmployeeDto.firstName,
        lastName: createEmployeeDto.lastName,
        birthDate: new Date(createEmployeeDto.birthDate),
        photoPath: createEmployeeDto.photoPath,
        notes: createEmployeeDto.notes,

        createdBy: {
          connect: { id: userId },
        },

        updatedBy: {
          connect: { id: userId },
        },
      },
    });
  }

  async update(
    id: number,
    updateEmployeeDto: UpdateEmployeeDto,
    userId: string,
  ) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
    });

    if (!employee) {
      throw new NotFoundException(`Employee with id ${id} not found`);
    }

    return this.prisma.employee.update({
      where: { id },
      data: {
        firstName: updateEmployeeDto.firstName,
        lastName: updateEmployeeDto.lastName,
        birthDate: updateEmployeeDto.birthDate
          ? new Date(updateEmployeeDto.birthDate)
          : undefined,
        photoPath: updateEmployeeDto.photoPath,
        notes: updateEmployeeDto.notes,

        updatedBy: {
          connect: { id: userId },
        },
      },
    });
  }

  async remove(id: number) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
    });

    if (!employee) {
      throw new NotFoundException(`Employee with id ${id} not found`);
    }

    await this.prisma.employee.delete({
      where: { id },
    });

    return {
      message: `Employee with id ${id} has been successfully deleted`,
    };
  }
}
