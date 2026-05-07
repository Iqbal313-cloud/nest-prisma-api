import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateEmployeeDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsDateString()
  birthDate: string;

  @IsOptional()
  @IsString()
  photoPath?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
