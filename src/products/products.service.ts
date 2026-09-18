import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductFilterDto } from './dto/product-filter.dto';
import {
  getPagination,
  getPaginationMeta,
} from 'src/common/utils/pagination.util';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  private generateSlug(productName: string): string {
    return productName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  private async generateUniqueSlug(productName: string): Promise<string> {
    const baseSlug = this.generateSlug(productName);

    let slug = baseSlug;
    let counter = 1;

    while (
      await this.prisma.product.findUnique({
        where: {
          slug,
        },
        select: {
          id: true,
        },
      })
    ) {
      counter++;
      slug = `${baseSlug}-${counter}`;
    }

    return slug;
  }

  async findAll(paginationDto: ProductFilterDto) {
    const {
      page = 1,
      limit = 10,
      productName,
      slug,
      sku,
      categoryId,
      supplierId,
      discontinued,
      minPrice,
      maxPrice,
    } = paginationDto;

    const pagination = getPagination(page, limit);

    const where = {
      ...(productName?.trim() && {
        productName: {
          contains: productName.trim(),
          mode: 'insensitive' as const,
        },
      }),

      ...(slug?.trim() && {
        slug: {
          contains: slug.trim(),
          mode: 'insensitive' as const,
        },
      }),

      ...(sku?.trim() && {
        sku: {
          contains: sku.trim(),
          mode: 'insensitive' as const,
        },
      }),

      ...(categoryId !== undefined && {
        categoryId,
      }),

      ...(supplierId !== undefined && {
        supplierId,
      }),

      ...(discontinued !== undefined && {
        discontinued: discontinued === 'true',
      }),

      ...((minPrice !== undefined || maxPrice !== undefined) && {
        unitPrice: {
          ...(minPrice !== undefined && {
            gte: minPrice,
          }),

          ...(maxPrice !== undefined && {
            lte: maxPrice,
          }),
        },
      }),
    };

    const [total, data] = await Promise.all([
      this.prisma.product.count({
        where,
      }),

      this.prisma.product.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,

        select: {
          id: true,
          productName: true,
          slug: true,
          sku: true,
          shortDescription: true,
          description: true,
          quantityPerUnit: true,
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

          createdAt: true,
          updatedAt: true,
        },

        orderBy: {
          id: 'asc',
        },
      }),
    ]);

    if (total === 0) {
      const filters: string[] = [];

      if (productName?.trim()) {
        filters.push(`productName="${productName.trim()}"`);
      }

      if (slug?.trim()) {
        filters.push(`slug="${slug.trim()}"`);
      }

      if (sku?.trim()) {
        filters.push(`sku="${sku.trim()}"`);
      }

      if (categoryId !== undefined) {
        filters.push(`categoryId=${categoryId}`);
      }

      if (supplierId !== undefined) {
        filters.push(`supplierId=${supplierId}`);
      }

      if (discontinued !== undefined) {
        filters.push(`discontinued=${discontinued}`);
      }

      if (minPrice !== undefined) {
        filters.push(`minPrice=${minPrice}`);
      }

      if (maxPrice !== undefined) {
        filters.push(`maxPrice=${maxPrice}`);
      }

      throw new NotFoundException(
        filters.length
          ? `No products found with ${filters.join(', ')}`
          : 'No products found',
      );
    }

    if (data.length === 0) {
      throw new NotFoundException(
        `Page ${page} does not exist. Last page is ${Math.ceil(
          total / limit,
        )}.`,
      );
    }

    return {
      data,
      meta: getPaginationMeta(total, pagination.page, pagination.limit),
    };
  }

  async findOne(id: number) {
    const product = await this.prisma.product.findUnique({
      where: {
        id,
      },

      select: {
        id: true,
        productName: true,
        slug: true,
        sku: true,
        shortDescription: true,
        description: true,
        quantityPerUnit: true,
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

        createdAt: true,
        updatedAt: true,
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  async create(createProductDto: CreateProductDto) {
    const slug = await this.generateUniqueSlug(createProductDto.productName);

    const product = await this.prisma.product.create({
      data: {
        productName: createProductDto.productName,

        // Automatically generated
        slug,

        // Automatically generated
        sku: `PRD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,

        shortDescription: createProductDto.shortDescription,

        description: createProductDto.description,

        quantityPerUnit: createProductDto.quantityPerUnit,

        unitPrice: createProductDto.unitPrice,

        unitsInStock: createProductDto.unitsInStock,

        unitsOnOrder: createProductDto.unitsOnOrder,

        discontinued: createProductDto.discontinued ?? false,

        ...(createProductDto.categoryId !== undefined && {
          category: {
            connect: {
              id: createProductDto.categoryId,
            },
          },
        }),

        ...(createProductDto.supplierId !== undefined && {
          supplier: {
            connect: {
              id: createProductDto.supplierId,
            },
          },
        }),
      },

      select: {
        id: true,
        productName: true,
        slug: true,
        sku: true,
        shortDescription: true,
        description: true,
        quantityPerUnit: true,
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

        createdAt: true,
        updatedAt: true,
      },
    });

    return product;
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    const existingProduct = await this.prisma.product.findUnique({
      where: {
        id,
      },
    });

    if (!existingProduct) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    const product = await this.prisma.product.update({
      where: {
        id,
      },

      data: {
        ...(updateProductDto.productName !== undefined && {
          productName: updateProductDto.productName,
          slug: await this.generateUniqueSlug(updateProductDto.productName),
        }),

        ...(updateProductDto.shortDescription !== undefined && {
          shortDescription: updateProductDto.shortDescription,
        }),

        ...(updateProductDto.description !== undefined && {
          description: updateProductDto.description,
        }),

        ...(updateProductDto.quantityPerUnit !== undefined && {
          quantityPerUnit: updateProductDto.quantityPerUnit,
        }),

        ...(updateProductDto.unitPrice !== undefined && {
          unitPrice: updateProductDto.unitPrice,
        }),

        ...(updateProductDto.unitsInStock !== undefined && {
          unitsInStock: updateProductDto.unitsInStock,
        }),

        ...(updateProductDto.unitsOnOrder !== undefined && {
          unitsOnOrder: updateProductDto.unitsOnOrder,
        }),

        ...(updateProductDto.discontinued !== undefined && {
          discontinued: updateProductDto.discontinued,
        }),

        ...(updateProductDto.categoryId !== undefined && {
          category: {
            connect: {
              id: updateProductDto.categoryId,
            },
          },
        }),

        ...(updateProductDto.supplierId !== undefined && {
          supplier: {
            connect: {
              id: updateProductDto.supplierId,
            },
          },
        }),
      },

      select: {
        id: true,
        productName: true,
        slug: true,
        sku: true,
        shortDescription: true,
        description: true,
        quantityPerUnit: true,
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

        createdAt: true,
        updatedAt: true,
      },
    });

    return product;
  }

  async remove(id: number) {
    const product = await this.prisma.product.findUnique({
      where: {
        id,
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

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
