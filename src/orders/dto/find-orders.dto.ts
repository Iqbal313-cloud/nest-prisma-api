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
  // @IsOptional()
  // @Type(() => Number)
  // @IsInt()
  // @Min(1)
  // page = 1;

  // @IsOptional()
  // @Type(() => Number)
  // @IsInt()
  // @Min(1)
  // limit = 10;

  // Global search
  @IsOptional()
  @IsString()
  search?: string;

  // Specific filters
  @IsOptional()
  @IsEnum(OrderStatus)
  orderStatus?: OrderStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  customerId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  employeeId?: number;

  @IsOptional()
  @IsString()
  customerName?: string;

  @IsOptional()
  @IsString()
  customerPhone?: string;

  @IsOptional()
  @IsString()
  employeeName?: string;

  @IsOptional()
  @IsString()
  productName?: string;

  // Date filter
  @IsOptional()
  @IsISO8601()
  fromDate?: string;

  @IsOptional()
  @IsISO8601()
  toDate?: string;
}
