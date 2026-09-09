import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import {
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  Min,
  ValidateNested,
} from 'class-validator';

import { Type } from 'class-transformer';

import { OrderStatus } from 'src/generated/prisma/enums';

export class CreateOrderDetailDto {
  @ApiProperty({
    example: 1,
    description: 'Product ID',
  })
  @IsInt()
  @Type(() => Number)
  productId!: number;

  @ApiProperty({
    example: 2,
    description: 'Quantity of the product',
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  quantity!: number;

  @ApiProperty({
    example: 1500.5,
    description: 'Unit price of the product',
  })
  @IsNumber()
  @Type(() => Number)
  unitPrice!: number;

  @ApiProperty({
    example: 100,
    description: 'Discount amount for this product',
  })
  @IsNumber()
  @Type(() => Number)
  discount!: number;
}

export class CreateOrderDto {
  @ApiPropertyOptional({
    example: '2026-08-29T10:30:00.000Z',
    description: 'Order creation date',
    format: 'date-time',
  })
  @IsOptional()
  @Type(() => Date)
  orderDate?: Date;

  @ApiPropertyOptional({
    enum: OrderStatus,
    example: OrderStatus.PENDING,
    description: 'Current status of the order',
  })
  @IsOptional()
  @IsEnum(OrderStatus)
  orderStatus?: OrderStatus;

  @ApiPropertyOptional({
    example: 1,
    description: 'Customer ID associated with the order',
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  customerId?: number;

  @ApiPropertyOptional({
    example: 5,
    description: 'Employee ID who created or manages the order',
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  employeeId?: number;

  @ApiProperty({
    type: () => [CreateOrderDetailDto],
    description: 'List of products included in the order',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderDetailDto)
  orderDetails!: CreateOrderDetailDto[];
}
