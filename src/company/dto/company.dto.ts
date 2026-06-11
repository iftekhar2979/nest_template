import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateCompanyDto {
  @ApiProperty({ description: 'Company name', example: 'Acme Corp', maxLength: 140 })
  @IsString()
  @MinLength(2)
  @MaxLength(140)
  companyName: string;

  @ApiProperty({ description: 'Short abbreviation', example: 'ACME', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  abbr?: string;

  @ApiProperty({ description: 'Default currency (ISO 4217)', example: 'USD', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  defaultCurrency?: string;

  @ApiProperty({ description: 'Country', example: 'United States', required: false })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({ description: 'Contact email', example: 'info@acme.com', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ description: 'Contact phone number', example: '+1234567890', required: false })
  @IsOptional()
  @IsString()
  phoneNo?: string;
}

export class UpdateCompanyDto extends PartialType(CreateCompanyDto) {}

export class CompanyResponseDto extends CreateCompanyDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: 'active' })
  status: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  updatedAt: Date;
}

export class CompanyDeleteResponseDto {
  @ApiProperty({ example: 'Company deleted successfully' })
  message: string;
}
