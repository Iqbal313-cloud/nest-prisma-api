import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateEmployeeDto {
  @ApiProperty({
    example: 'John',
    description: 'Employee first name',
  })
  @IsString()
  firstName!: string;

  @ApiProperty({
    example: 'Doe',
    description: 'Employee last name',
  })
  @IsString()
  lastName!: string;

  @ApiProperty({
    example: '1995-05-15',
    description: 'Employee date of birth',
    format: 'date',
  })
  @IsDateString()
  birthDate!: string;

  @ApiPropertyOptional({
    example: '/uploads/employees/john-doe.jpg',
    description: 'Path to the employee photo',
  })
  @IsOptional()
  @IsString()
  photoPath?: string;

  @ApiPropertyOptional({
    example: 'Experienced sales employee',
    description: 'Additional notes about the employee',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
