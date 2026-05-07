import { Injectable } from '@nestjs/common';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { PaginationDto } from 'src/customers/dto/pagination.dto';
import { NotFoundException } from '@nestjs/common';

@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(paginationDto: PaginationDto) {
    const page = Number(paginationDto.page) || 1;
    const limit = Number(paginationDto.limit) || 10;
    const skip = (page - 1) * limit;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.employee.findMany({
        skip,
        take: limit,
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
      }),

      this.prisma.employee.count(),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
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
