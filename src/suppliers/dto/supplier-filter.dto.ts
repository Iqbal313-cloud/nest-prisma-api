import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

import { PaginationDto } from 'src/common/utils/pagination.dto';

export class SupplierFilterDto extends PaginationDto {
  @ApiPropertyOptional({ example: 'Yundt' })
  @IsOptional()
  @IsString()
  supplierName?: string;

  @ApiPropertyOptional({ example: 'Humberto' })
  @IsOptional()
  @IsString()
  contactName?: string;

  @ApiPropertyOptional({ example: '8008 Elm Street' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'Reillychester' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'New Caledonia' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ example: '1-320-931-9321' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: '12345' })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiPropertyOptional({ example: 'Iqbal' })
  @IsOptional()
  @IsString()
  createdByName?: string;

  @ApiPropertyOptional({ example: 'Iqbal' })
  @IsOptional()
  @IsString()
  updatedByName?: string;
}
