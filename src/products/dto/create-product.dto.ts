// create-product.dto.ts

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
  @IsString()
  @IsNotEmpty()
  productName: string;

  @IsNumber()
  @Min(0)
  unitPrice: number;

  @IsInt()
  @Min(0)
  unitsInStock: number;

  @IsInt()
  @Min(0)
  unitsOnOrder: number;

  @IsBoolean()
  @IsOptional()
  discontinued?: boolean;

  @IsInt()
  categoryId: number;

  @IsInt()
  supplierId: number;
}
