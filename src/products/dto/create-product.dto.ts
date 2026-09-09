import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateProductDto {
  @ApiProperty({
    example: 'Marble Keyboard',
    description: 'Name of the product',
  })
  @IsString()
  @IsNotEmpty()
  productName!: string;

  @ApiPropertyOptional({
    example: 'Premium marble-finish mechanical keyboard',
    description: 'Short description of the product',
  })
  @IsOptional()
  @IsString()
  shortDescription?: string;

  @ApiPropertyOptional({
    example: 'Premium mechanical keyboard with marble finish.',
    description: 'Full product description',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: '1 piece',
    description: 'Quantity per unit',
  })
  @IsOptional()
  @IsString()
  quantityPerUnit?: string;

  @ApiPropertyOptional({
    example: 125000.5,
    description: 'Unit price of the product',
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  unitPrice?: number;

  @ApiPropertyOptional({
    example: 50,
    description: 'Number of units currently in stock',
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  unitsInStock?: number;

  @ApiPropertyOptional({
    example: 10,
    description: 'Number of units currently on order',
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  unitsOnOrder?: number;

  @ApiPropertyOptional({
    example: false,
    default: false,
    description: 'Whether the product has been discontinued',
  })
  @IsOptional()
  @IsBoolean()
  discontinued?: boolean;

  @ApiPropertyOptional({
    example: 1,
    description: 'Category ID of the product',
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  categoryId?: number;

  @ApiPropertyOptional({
    example: 1,
    description: 'Supplier ID of the product',
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  supplierId?: number;
}
