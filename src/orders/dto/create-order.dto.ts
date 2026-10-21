import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
  IsNotEmpty,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OrderStatus } from 'src/generated/prisma/enums';

export class CreateOrderDetailDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  productId!: number;

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  quantity!: number;

  @ApiProperty({ example: 1500.5 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  unitPrice!: number;

  @ApiPropertyOptional({
    example: 40,
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  discount?: number;
}

export class CreateOrderDto {
  @ApiProperty({ example: 'Rahim' })
  @IsString()
  @IsNotEmpty()
  customerFirstName!: string;

  @ApiPropertyOptional({ example: 'Uddin' })
  @IsOptional()
  @IsString()
  customerLastName?: string;

  @ApiProperty({ example: '202.343.3996' })
  @IsString()
  @IsNotEmpty()
  customerPhone!: string;

  @ApiPropertyOptional({ example: 'Dhaka' })
  @IsOptional()
  @IsString()
  customerAddress?: string;

  @ApiPropertyOptional({
    example: '2026-10-19T10:30:00.000Z',
    format: 'date-time',
  })
  @IsOptional()
  @Type(() => Date)
  orderDate?: Date;

  @ApiPropertyOptional({ enum: OrderStatus })
  @IsOptional()
  @IsEnum(OrderStatus)
  orderStatus?: OrderStatus;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  employeeId?: number;

  @ApiProperty({ type: () => [CreateOrderDetailDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderDetailDto)
  orderDetails!: CreateOrderDetailDto[];
}
