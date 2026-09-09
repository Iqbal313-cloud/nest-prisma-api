import { IsString, IsOptional, IsEmail } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCustomerDto {
  @ApiProperty({
    example: 'Iqbal',
    description: 'Customer first name',
  })
  @IsString()
  firstName!: string;

  @ApiPropertyOptional({
    example: 'Ahmed',
    description: 'Customer last name',
  })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional({
    example: 'iqbal@example.com',
    description: 'Customer email address',
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    example: '+8801712345678',
    description: 'Customer phone number',
  })
  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @ApiPropertyOptional({
    example: 'Dhaka, Bangladesh',
    description: 'Customer address',
  })
  @IsString()
  @IsOptional()
  address?: string;
}
