import { IsIn, IsOptional } from 'class-validator';

export class OrderTrendsQueryDto {
  @IsOptional()
  @IsIn(['day', 'week', 'month'])
  groupBy?: 'day' | 'week' | 'month' = 'day';
}
