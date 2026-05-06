// import { PartialType } from '@nestjs/mapped-types';
// import { CreateCustomerDto } from './create-customer.dto';

// export class UpdateCustomerDto extends PartialType(CreateCustomerDto) {}

import { IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}
