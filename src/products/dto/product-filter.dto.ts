import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBooleanString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { PaginationDto } from 'src/common/utils/pagination.dto';

export class ProductFilterDto extends PaginationDto {
  @ApiPropertyOptional({
    example: 'iPhone',
    description: 'Filter products by name',
  })
  @IsOptional()
  @IsString()
  productName?: string;

  @ApiPropertyOptional({
    example: 'iphone-17-pro',
    description: 'Filter products by slug',
  })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({
    example: 'IPHONE-17-PRO-001',
    description: 'Filter products by SKU',
  })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiPropertyOptional({
    example: 1,
    minimum: 1,
    description: 'Filter products by category ID',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  categoryId?: number;

  @ApiPropertyOptional({
    example: 1,
    minimum: 1,
    description: 'Filter products by supplier ID',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  supplierId?: number;

  @ApiPropertyOptional({
    example: 'false',
    enum: ['true', 'false'],
    description: 'Filter products by discontinued status',
  })
  @IsOptional()
  @IsBooleanString()
  discontinued?: string;

  @ApiPropertyOptional({
    example: 100,
    minimum: 0,
    description: 'Minimum product price',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({
    example: 10000,
    minimum: 0,
    description: 'Maximum product price',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({
    example: 'Iqbal',
    description: 'Filter products by creator name',
  })
  @IsOptional()
  @IsString()
  createdByName?: string;

  @ApiPropertyOptional({
    example: 'Iqbal',
    description: 'Filter products by updater name',
  })
  @IsOptional()
  @IsString()
  updatedByName?: string;
}
