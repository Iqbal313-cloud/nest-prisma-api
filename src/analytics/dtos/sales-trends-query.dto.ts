import { IsIn, IsOptional } from 'class-validator';

export class SalesTrendsQueryDto {
  @IsOptional()
  @IsIn(['day', 'week', 'month'])
  groupBy?: 'day' | 'week' | 'month' = 'day';
}
