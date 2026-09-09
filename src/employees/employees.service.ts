import { Injectable } from '@nestjs/common';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { PaginationDto } from 'src/customers/dto/pagination.dto';
import { NotFoundException } from '@nestjs/common';
import { EmployeeFilterDto } from './dto/employee-filter.dto';

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
    } = filterDto;

    const skip = (Number(page) - 1) * Number(limit);

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

      ...(Object.keys(orderWhere).length > 0 && {
        orders: {
          some: orderWhere,
        },
      }),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.employee.findMany({
        where,
        skip,
        take: Number(limit),

        select: {
          id: true,
          firstName: true,
          lastName: true,
          birthDate: true,
          photoPath: true,
          notes: true,

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
      meta: {
        total,
        page: Number(page),
        lastPage: Math.ceil(total / Number(limit)),
      },
    };
  }

  async findOne(id: number) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: Number(id) },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        birthDate: true,
        photoPath: true,
        notes: true,
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

  async create(createEmployeeDto: CreateEmployeeDto) {
    return this.prisma.employee.create({
      data: {
        firstName: createEmployeeDto.firstName,
        lastName: createEmployeeDto.lastName,
        birthDate: new Date(createEmployeeDto.birthDate),
        photoPath: createEmployeeDto.photoPath,
        notes: createEmployeeDto.notes,
      },
    });
  }

  async update(id: number, updateEmployeeDto: UpdateEmployeeDto) {
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
