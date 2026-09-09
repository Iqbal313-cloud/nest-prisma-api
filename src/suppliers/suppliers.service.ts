import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from 'src/generated/prisma/client';
import { SupplierPaginationDto } from './dto/supplier-pagination';

@Injectable()
export class SuppliersService {
  constructor(private readonly prisma: PrismaService) {}
  async findAll(paginationDto: SupplierPaginationDto) {
    const page = paginationDto.page ?? 1;
    const limit = paginationDto.limit ?? 10;
    const skip = (page - 1) * limit;

    const {
      supplierName,
      contactName,
      address,
      city,
      country,
      phone,
      postalCode,
    } = paginationDto;

    const where: Prisma.SupplierWhereInput = {
      ...(supplierName && {
        supplierName: {
          contains: supplierName.trim(),
          mode: 'insensitive',
        },
      }),

      ...(contactName && {
        contactName: {
          contains: contactName.trim(),
          mode: 'insensitive',
        },
      }),

      ...(address && {
        address: {
          contains: address.trim(),
          mode: 'insensitive',
        },
      }),

      ...(city && {
        city: {
          contains: city.trim(),
          mode: 'insensitive',
        },
      }),

      ...(country && {
        country: {
          contains: country.trim(),
          mode: 'insensitive',
        },
      }),

      ...(phone && {
        phone: {
          contains: phone.trim(),
          mode: 'insensitive',
        },
      }),

      ...(postalCode && {
        postalCode: {
          contains: postalCode.trim(),
          mode: 'insensitive',
        },
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.supplier.findMany({
        where,
        skip,
        take: limit,

        orderBy: {
          id: 'desc',
        },

        select: {
          id: true,
          supplierName: true,
          contactName: true,
          address: true,
          city: true,
          postalCode: true,
          country: true,
          phone: true,
          createdAt: true,
          updatedAt: true,

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

      this.prisma.supplier.count({
        where,
      }),
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
}
