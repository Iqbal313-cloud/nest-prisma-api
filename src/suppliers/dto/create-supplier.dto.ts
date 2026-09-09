import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class CreateSupplierDto {
  @ApiProperty({
    example: 'ABC Electronics Ltd.',
    description: 'Name of the supplier',
  })
  @IsString()
  supplierName!: string;

  @ApiPropertyOptional({
    example: 'John Doe',
    description: 'Name of the supplier contact person',
  })
  @IsOptional()
  @IsString()
  contactName?: string;

  @ApiPropertyOptional({
    example: '123 Main Street',
    description: 'Supplier street address',
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    example: 'Dhaka',
    description: 'Supplier city',
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({
    example: '1205',
    description: 'Supplier postal code',
  })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiPropertyOptional({
    example: 'Bangladesh',
    description: 'Supplier country',
  })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({
    example: '+8801712345678',
    description: 'Supplier phone number',
  })
  @IsOptional()
  @IsString()
  phone?: string;
}
