import {
  Body,
  Controller,
  Get,
  Logger,
  NotFoundException,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { Category } from 'src/generated/prisma/client';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
// import { CreateCategoryDto } from './dto/create-category.dto';
// import { UpdateCategoryDto } from './dto/update-category.dto';

@Controller('categories')
export class CategoriesController {
  private readonly logger = new Logger(CategoriesController.name);

  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  async findAll(): Promise<any[]> {
    this.logger.log('Fetching all categories');
    const categories = await this.categoriesService.findAll();
    this.logger.log(`Found ${categories.length} categories`);
    return categories;
  }

  @Get(':id')
  async getCategory(@Param('id') id: string): Promise<Category> {
    const category = (await this.categoriesService.findOneWithChildren(
      +id,
    )) as Category;
    if (!category) {
      throw new NotFoundException(`Category with id ${id} not found.`);
    }
    return category;
  }

  @Post()
  async create(
    @Body() createCategoryDto: CreateCategoryDto,
  ): Promise<Category> {
    return this.categoriesService.create(createCategoryDto);
  }

  @Patch(':id')
  async update(
    @Param('id') id: number,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ): Promise<Category> {
    return this.categoriesService.update(+id, updateCategoryDto);
  }
}
/*
  // @Get(':id') // Define a route for fetching a single category by id
  // async findOne(
  //   @Param('id', ParseIntPipe) categoryId: number,
  // ): Promise<Category> {
  //   const category =
  //     await this.categoriesService.findOneWithChildren(categoryId);

  //   if (!category) {
  //     throw new NotFoundException(`Category with id ${categoryId} not found.`);
  //   }

  //   return category;
  // }
  // 
  //   // @Get() // HTTP GET request to retrieve all categories
  // async findAll() {
  //   return this.categoriesService.findAll(); // Call the service's findAll method
  // }
  // 
  // 
  // 
  // 
  // 
  // 
  // 
  // 
  // */
