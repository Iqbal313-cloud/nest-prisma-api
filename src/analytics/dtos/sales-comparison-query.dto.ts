import { IsIn, IsOptional } from 'class-validator';

export class SalesComparisonQueryDto {
  @IsOptional()
  @IsIn(['week', 'month', 'year'])
  period: 'week' | 'month' | 'year' = 'month';
}
