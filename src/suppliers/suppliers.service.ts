import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { PaginationDto } from 'src/customers/dto/pagination.dto';
import { Prisma } from 'src/generated/prisma/client';

@Injectable()
export class SuppliersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(paginationDto: PaginationDto) {
    const page = Number(paginationDto.page) || 1;
    const limit = Number(paginationDto.limit) || 10;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.supplier.findMany({
        skip,
        take: limit,
        include: {
          products: {
            select: {
              id: true,
              productName: true,
            },
          },
          _count: {
            select: {
              products: true,
            },
          },
        },
      }),
      this.prisma.supplier.count(),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number) {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id },
      include: {
        products: {
          select: {
            id: true,
            productName: true,
          },
        },
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    if (!supplier) {
      throw new Error(`Supplier with ID ${id} not found`);
    }

    return supplier;
  }

  async create(createSupplierDto: CreateSupplierDto) {
    const supplier = await this.prisma.supplier.create({
      data: {
        ...createSupplierDto,
      },
    });
    return supplier;
  }

  async update(id: number, updateSupplierDto: UpdateSupplierDto) {
    // Check if supplier exists
    const existingSupplier = await this.prisma.supplier.findUnique({
      where: { id },
    });

    if (!existingSupplier) {
      throw new NotFoundException(`Supplier with ID ${id} not found`);
    }

    // Update supplier
    const updatedSupplier = await this.prisma.supplier.update({
      where: { id },
      data: {
        ...updateSupplierDto,
      },
    });

    return updatedSupplier;
  }

  async remove(id: number) {
    const existingSupplier = await this.prisma.supplier.findUnique({
      where: { id },
    });

    if (!existingSupplier) {
      throw new NotFoundException(`Supplier with ID ${id} not found`);
    }

    // Delete supplier
    await this.prisma.supplier.delete({
      where: { id },
    });

    return {
      message: `Supplier with ID ${id} has been successfully deleted`,
    };
  }


  async searchAll(query: string) {
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      return { data: [], total: 0 };
    }

    const where: Prisma.SupplierWhereInput = {
      OR: [
        {
          supplierName: {
            contains: trimmedQuery,
            mode: Prisma.QueryMode.insensitive,
          },
        },
        {
          city: { contains: trimmedQuery, mode: Prisma.QueryMode.insensitive },
        },
        {
          country: {
            contains: trimmedQuery,
            mode: Prisma.QueryMode.insensitive,
          },
        },
        {
          contactName: {
            contains: trimmedQuery,
            mode: Prisma.QueryMode.insensitive,
          },
        },
      ],
    };

    const data = await this.prisma.supplier.findMany({
      where,
      include: {
        products: { select: { id: true, productName: true } },
        _count: { select: { products: true } },
      },
    });

    return { data, total: data.length };
  }
}
