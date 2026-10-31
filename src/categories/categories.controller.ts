import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { Category } from 'src/generated/prisma/client';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { ApiTags } from '@nestjs/swagger';
import { UserHasPermission } from '@thallesp/nestjs-better-auth';
// import { CreateCategoryDto } from './dto/create-category.dto';
// import { UpdateCategoryDto } from './dto/update-category.dto';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  private readonly logger = new Logger(CategoriesController.name);

  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @UserHasPermission({
    permission: {
      category: ['read'],
    },
  })
  async findAll(): Promise<any[]> {
    this.logger.log('Fetching all categories');

    const categories = await this.categoriesService.findAll();

    this.logger.log(`Found ${categories.length} categories`);

    return categories;
  }

  @Get(':id')
  @UserHasPermission({
    permission: {
      category: ['read'],
    },
  })
  async getCategory(@Param('id', ParseIntPipe) id: number): Promise<Category> {
    const category = (await this.categoriesService.findOneWithChildren(
      id,
    )) as Category;

    if (!category) {
      throw new NotFoundException(`Category with id ${id} not found.`);
    }

    return category;
  }

  @Post()
  @UserHasPermission({
    permission: {
      category: ['create'],
    },
  })
  async create(
    @Body() createCategoryDto: CreateCategoryDto,
  ): Promise<Category> {
    return this.categoriesService.create(createCategoryDto);
  }

  @Patch(':id')
  @UserHasPermission({
    permission: {
      category: ['update'],
    },
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ): Promise<Category> {
    return this.categoriesService.update(id, updateCategoryDto);
  }

  @Delete(':id')
  @UserHasPermission({
    permission: {
      category: ['delete'],
    },
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.remove(id);
  }
}
