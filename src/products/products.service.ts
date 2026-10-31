import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { format } from '@fast-csv/format';
import { Response } from 'express';

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
    const { page = 1, limit = 10 } = paginationDto;

    const pagination = getPagination(page, limit);

    const where = this.buildProductFilter(paginationDto);

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
          id: 'desc',
        },
      }),
    ]);

    if (total === 0) {
      const filters: string[] = [];

      if (paginationDto.productName?.trim()) {
        filters.push(`productName="${paginationDto.productName.trim()}"`);
      }

      if (paginationDto.slug?.trim()) {
        filters.push(`slug="${paginationDto.slug.trim()}"`);
      }

      if (paginationDto.sku?.trim()) {
        filters.push(`sku="${paginationDto.sku.trim()}"`);
      }

      if (paginationDto.categoryId !== undefined) {
        filters.push(`categoryId=${paginationDto.categoryId}`);
      }

      if (paginationDto.supplierId !== undefined) {
        filters.push(`supplierId=${paginationDto.supplierId}`);
      }

      if (paginationDto.discontinued !== undefined) {
        filters.push(`discontinued=${paginationDto.discontinued}`);
      }

      if (paginationDto.minPrice !== undefined) {
        filters.push(`minPrice=${paginationDto.minPrice}`);
      }

      if (paginationDto.maxPrice !== undefined) {
        filters.push(`maxPrice=${paginationDto.maxPrice}`);
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

  private buildProductFilter(filterDto: ProductFilterDto) {
    const {
      productName,
      slug,
      sku,
      categoryId,
      supplierId,
      discontinued,
      minPrice,
      maxPrice,
    } = filterDto;

    return {
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
  }

  async exportToCsv(filterDto: ProductFilterDto, response: Response) {
    // =========================
    // Prevent unfiltered export
    // =========================
    const hasFilter =
      filterDto.productName?.trim() ||
      filterDto.slug?.trim() ||
      filterDto.sku?.trim() ||
      filterDto.categoryId !== undefined ||
      filterDto.supplierId !== undefined ||
      filterDto.discontinued !== undefined ||
      filterDto.minPrice !== undefined ||
      filterDto.maxPrice !== undefined;

    if (!hasFilter) {
      throw new BadRequestException('CSV export requires at least one filter');
    }

    // =========================
    // Build filters
    // =========================
    const where = this.buildProductFilter(filterDto);

    const batchSize = 1000;

    const csvStream = format({
      headers: [
        'ID',
        'Product Name',
        'Slug',
        'SKU',
        'Short Description',
        'Description',
        'Quantity Per Unit',
        'Unit Price',
        'Units In Stock',
        'Units On Order',
        'Discontinued',
        'Category',
        'Supplier',
        'Created At',
        'Updated At',
      ],
    });

    response.setHeader('Content-Type', 'text/csv; charset=utf-8');

    response.setHeader(
      'Content-Disposition',
      'attachment; filename="products.csv"',
    );

    csvStream.pipe(response);

    let lastProductId: number | undefined;

    while (true) {
      const products = await this.prisma.product.findMany({
        where: {
          ...where,

          ...(lastProductId !== undefined && {
            id: {
              gt: lastProductId,
            },
          }),
        },

        take: batchSize,

        orderBy: {
          id: 'asc',
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
              categoryName: true,
            },
          },

          supplier: {
            select: {
              supplierName: true,
            },
          },

          createdAt: true,
          updatedAt: true,
        },
      });

      if (products.length === 0) {
        break;
      }

      for (const product of products) {
        csvStream.write({
          ID: product.id,
          'Product Name': product.productName,
          Slug: product.slug,
          SKU: product.sku,
          'Short Description': product.shortDescription ?? '',
          Description: product.description ?? '',
          'Quantity Per Unit': product.quantityPerUnit ?? '',
          'Unit Price': product.unitPrice,
          'Units In Stock': product.unitsInStock,
          'Units On Order': product.unitsOnOrder,
          Discontinued: product.discontinued,
          Category: product.category?.categoryName ?? '',
          Supplier: product.supplier?.supplierName ?? '',
          'Created At': product.createdAt,
          'Updated At': product.updatedAt,
        });
      }

      lastProductId = products[products.length - 1].id;

      if (products.length < batchSize) {
        break;
      }
    }

    csvStream.end();
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
