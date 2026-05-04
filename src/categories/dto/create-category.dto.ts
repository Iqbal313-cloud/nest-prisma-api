import { IsOptional, IsString, IsInt, Length } from 'class-validator';

export class CreateCategoryDto {
  @IsOptional()
  @IsString()
  @Length(2, 55)
  categoryName?: string;

  @IsOptional()
  @IsString()
  @Length(2, 55)
  description?: string;

  @IsOptional()
  @IsInt()
  parentId?: number;
}
