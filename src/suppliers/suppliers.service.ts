import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from 'src/generated/prisma/client';
import { SupplierFilterDto } from './dto/supplier-filter.dto';
import {
  getPagination,
  getPaginationMeta,
} from 'src/common/utils/pagination.util';

@Injectable()
export class SuppliersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(paginationDto: SupplierFilterDto) {
    const page = paginationDto.page ?? 1;
    const limit = paginationDto.limit ?? 10;
    const pagination = getPagination(page, limit);

    const {
      supplierName,
      contactName,
      address,
      city,
      country,
      phone,
      postalCode,
      createdByName,
      updatedByName,
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

      ...(createdByName?.trim() && {
        createdBy: {
          name: {
            contains: createdByName.trim(),
            mode: 'insensitive',
          },
        },
      }),

      ...(updatedByName?.trim() && {
        updatedBy: {
          name: {
            contains: updatedByName.trim(),
            mode: 'insensitive',
          },
        },
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.supplier.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,

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
        },
      }),

      this.prisma.supplier.count({
        where,
      }),
    ]);

    return {
      data,
      meta: getPaginationMeta(total, pagination.page, pagination.limit),
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
      },
    });

    if (!supplier) {
      throw new Error(`Supplier with ID ${id} not found`);
    }

    return supplier;
  }

  async create(createSupplierDto: CreateSupplierDto, userId: string) {
    const supplier = await this.prisma.supplier.create({
      data: {
        ...createSupplierDto,
        createdById: userId,
      },
    });
    return supplier;
  }

  async update(
    id: number,
    updateSupplierDto: UpdateSupplierDto,
    userId: string,
  ) {
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
        updatedById: userId,
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
