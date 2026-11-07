import { BadRequestException, Injectable } from '@nestjs/common';
import { Category } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<any[]> {
    const categories = await this.prisma.category.findMany({
      include: {
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

    // Helper function to recursively build the tree
    const buildTree = (parentId: number | null): any[] => {
      return categories
        .filter((category) => category.parentId === parentId)
        .map((category) => {
          const { createdById, updatedById, ...categoryData } = category;

          return {
            ...categoryData,
            children: buildTree(category.id),
          };
        });
    };

    // Start from root categories (parentId = null)
    return buildTree(null);
  }

  async findOneWithChildren(id: number): Promise<any | null> {
    const categories = await this.prisma.category.findMany({
      include: {
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

    const map = new Map<number, any>();

    categories.forEach((category) => {
      const { createdById, updatedById, ...categoryData } = category;

      map.set(category.id, {
        ...categoryData,
        children: [],
      });
    });

    categories.forEach((category) => {
      if (category.parentId !== null) {
        const parent = map.get(category.parentId);

        if (parent) {
          parent.children.push(map.get(category.id));
        }
      }
    });

    return map.get(id) ?? null;
  }

  async create(
    createCategoryDto: CreateCategoryDto,
    userId: string,
  ): Promise<Category> {
    const { categoryName, description, parentId } = createCategoryDto;

    if (parentId) {
      const parentExists = await this.prisma.category.findUnique({
        where: { id: parentId },
      });

      if (!parentExists) {
        throw new BadRequestException('Invalid parentId');
      }
    }

    return this.prisma.category.create({
      data: {
        categoryName,
        description,
        parentId,
        createdById: userId,
        updatedById: userId,
      },
      include: {
        createdBy: {
          select: { name: true },
        },
        updatedBy: {
          select: { name: true },
        },
      },
    });
  }

  async update(
    id: number,
    updateCategoryDto: UpdateCategoryDto,
    userId: string,
  ): Promise<Category> {
    const { categoryName, description, parentId } = updateCategoryDto;

    const categoryExists = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!categoryExists) {
      throw new BadRequestException('Category not found');
    }

    if (parentId) {
      const parentExists = await this.prisma.category.findUnique({
        where: { id: parentId },
      });

      if (!parentExists) {
        throw new BadRequestException('Invalid parentId');
      }
    }

    return this.prisma.category.update({
      where: { id },
      data: {
        categoryName,
        description,
        parentId,
        updatedById: userId,
      },
      include: {
        createdBy: {
          select: { name: true },
        },
        updatedBy: {
          select: { name: true },
        },
      },
    });
  }

  async remove(id: number): Promise<{ message: string; category: Category }> {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new BadRequestException('Category not found');
    }

    const deletedCategory = await this.prisma.category.delete({
      where: { id },
    });

    return {
      message: 'Category deleted successfully',
      category: deletedCategory,
    };
  }
}
