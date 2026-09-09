import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

import { PaginationDto } from 'src/customers/dto/pagination.dto';
import { OrderStatus } from 'src/generated/prisma/enums';

export class FindOrdersDto extends PaginationDto {
  @ApiPropertyOptional({
    example: 'laptop',
    description: 'Search orders by customer, employee, or product information',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    enum: OrderStatus,
    description: 'Filter orders by order status',
  })
  @IsOptional()
  @IsEnum(OrderStatus)
  orderStatus?: OrderStatus;

  @ApiPropertyOptional({
    example: 1,
    description: 'Filter orders by customer ID',
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  customerId?: number;

  @ApiPropertyOptional({
    example: 5,
    description: 'Filter orders by employee ID',
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  employeeId?: number;

  @ApiPropertyOptional({
    example: 'John Doe',
    description: 'Filter orders by customer name',
  })
  @IsOptional()
  @IsString()
  customerName?: string;

  @ApiPropertyOptional({
    example: '+8801712345678',
    description: 'Filter orders by customer phone number',
  })
  @IsOptional()
  @IsString()
  customerPhone?: string;

  @ApiPropertyOptional({
    example: 'John',
    description: 'Filter orders by employee name',
  })
  @IsOptional()
  @IsString()
  employeeName?: string;

  @ApiPropertyOptional({
    example: 'iPhone',
    description: 'Filter orders by product name',
  })
  @IsOptional()
  @IsString()
  productName?: string;

  @ApiPropertyOptional({
    example: '2026-01-01T00:00:00.000Z',
    description: 'Return orders created from this date',
    format: 'date-time',
  })
  @IsOptional()
  @IsISO8601()
  fromDate?: string;

  @ApiPropertyOptional({
    example: '2026-08-29T23:59:59.999Z',
    description: 'Return orders created until this date',
    format: 'date-time',
  })
  @IsOptional()
  @IsISO8601()
  toDate?: string;
}
