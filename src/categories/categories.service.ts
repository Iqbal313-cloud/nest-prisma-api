import { BadRequestException, Injectable } from '@nestjs/common';
import { Category } from 'src/generated/prisma/client';
// import { CreateCategoryDto } from './dto/create-category.dto';
// import { UpdateCategoryDto } from './dto/update-category.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<any[]> {
    const categories = await this.prisma.category.findMany();

    // Helper function to recursively build the tree
    const buildTree = (parentId: number | null): any[] => {
      return categories
        .filter((category) => category.parentId === parentId)
        .map((category) => ({
          ...category,
          children: buildTree(category.id),
        }));
    };

    // Start from root categories (parentId = null)
    return buildTree(null);
  }

  async findOneWithChildren(id: number): Promise<any | null> {
    const categories = await this.prisma.category.findMany();

    // build lookup for faster access (optional but better performance)
    const map = new Map<number, any>();

    categories.forEach((cat) => {
      map.set(cat.id, { ...cat, children: [] });
    });

    // build tree structure
    categories.forEach((cat) => {
      if (cat.parentId !== null) {
        const parent = map.get(cat.parentId);
        if (parent) {
          parent.children.push(map.get(cat.id));
        }
      }
    });

    return map.get(id) || null;
  }

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    const { categoryName, description, parentId } = createCategoryDto;

    // Optional safety check for parent
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
      },
    });
  }

  async update(
    id: number,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<Category> {
    const { categoryName, description, parentId } = updateCategoryDto;

    // Check if category exists
    const categoryExists = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!categoryExists) {
      throw new BadRequestException('Category not found');
    }

    // Optional safety check for parent
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
      },
    });
  }
}
