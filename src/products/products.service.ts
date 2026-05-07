import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaService } from 'src/prisma/prisma.service';

import { PaginationDto } from 'src/customers/dto/pagination.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  // Find all products
  async findAll(paginationDto: PaginationDto) {
    const page = Number(paginationDto.page) || 1;
    const limit = Number(paginationDto.limit) || 10;

    const skip = (page - 1) * limit;

    const [total, data] = await Promise.all([
      this.prisma.product.count(),
      this.prisma.product.findMany({
        skip,
        take: limit,
        select: {
          id: true,
          productName: true,
          unitPrice: true,
          unitsInStock: true,
          unitsOnOrder: true,
          discontinued: true,
          category: {
            select: {
              id: true,
              categoryName: true,
            },
          },
          supplier: {
            select: {
              id: true,
              supplierName: true,
            },
          },
        },
        orderBy: { id: 'asc' },
      }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      select: {
        id: true,
        productName: true,
        unitPrice: true,
        unitsInStock: true,
        unitsOnOrder: true,
        discontinued: true,
        category: {
          select: {
            id: true,
            categoryName: true,
          },
        },

        supplier: {
          select: {
            id: true,
            supplierName: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  async create(createProductDto: CreateProductDto) {
    const product = await this.prisma.product.create({
      data: {
        productName: createProductDto.productName,
        unitPrice: createProductDto.unitPrice,
        unitsInStock: createProductDto.unitsInStock,
        unitsOnOrder: createProductDto.unitsOnOrder,
        discontinued: createProductDto.discontinued,

        category: {
          connect: {
            id: createProductDto.categoryId,
          },
        },

        supplier: {
          connect: {
            id: createProductDto.supplierId,
          },
        },
      },

      select: {
        id: true,
        productName: true,
        unitPrice: true,
        unitsInStock: true,
        unitsOnOrder: true,
        discontinued: true,

        category: {
          select: {
            id: true,
            categoryName: true,
          },
        },

        supplier: {
          select: {
            id: true,
            supplierName: true,
          },
        },
      },
    });

    return product;
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    const product = await this.prisma.product.update({
      where: {
        id,
      },

      data: {
        productName: updateProductDto.productName,
        unitPrice: updateProductDto.unitPrice,
        unitsInStock: updateProductDto.unitsInStock,
        unitsOnOrder: updateProductDto.unitsOnOrder,
        discontinued: updateProductDto.discontinued,

        category: updateProductDto.categoryId
          ? {
              connect: {
                id: updateProductDto.categoryId,
              },
            }
          : undefined,

        supplier: updateProductDto.supplierId
          ? {
              connect: {
                id: updateProductDto.supplierId,
              },
            }
          : undefined,
      },

      select: {
        id: true,
        productName: true,
        unitPrice: true,
        unitsInStock: true,
        unitsOnOrder: true,
        discontinued: true,

        category: {
          select: {
            id: true,
            categoryName: true,
          },
        },

        supplier: {
          select: {
            id: true,
            supplierName: true,
          },
        },
      },
    });

    return product;
  }

  async remove(id: number) {
    await this.prisma.product.delete({
      where: {
        id,
      },
    });

    return {
      message: `Product with id ${id} has been deleted successfully`,
    };
  }
}
