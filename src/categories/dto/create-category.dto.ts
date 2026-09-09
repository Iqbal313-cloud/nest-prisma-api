import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Length } from 'class-validator';

export class CreateCategoryDto {
  @ApiPropertyOptional({
    example: 'Electronics',
    description: 'Category name',
    minLength: 2,
    maxLength: 55,
  })
  @IsOptional()
  @IsString()
  @Length(2, 55)
  categoryName?: string;

  @ApiPropertyOptional({
    example: 'Electronic products and accessories',
    description: 'Category description',
    minLength: 2,
    maxLength: 55,
  })
  @IsOptional()
  @IsString()
  @Length(2, 55)
  description?: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Parent category ID. Null or omitted for a root category.',
  })
  @IsOptional()
  @IsInt()
  parentId?: number;
}
