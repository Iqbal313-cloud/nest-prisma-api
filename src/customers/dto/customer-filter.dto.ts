import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum } from 'class-validator';
import { PaginationDto } from '../../common/utils/pagination.dto';
import { OrderStatus } from 'src/generated/prisma/enums';

export class CustomerFilterDto extends PaginationDto {
  @ApiPropertyOptional({
    example: 'Randolph',
    description: 'Filter by first name',
  })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({
    example: 'Sauer',
    description: 'Filter by last name',
  })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({
    example: '657',
    description: 'Filter by phone number',
  })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({
    example: 'Rufus',
    description: 'Filter by address',
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    enum: OrderStatus,
    example: OrderStatus.PROCESSING,
    description: 'Filter customers by order status',
  })
  @IsOptional()
  @IsEnum(OrderStatus)
  orderStatus?: OrderStatus;

  @IsOptional()
  @IsString()
  createdByName?: string;

  @IsOptional()
  @IsString()
  updatedByName?: string;
}
