import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateDesignationDto {
  @ApiProperty({
    description: 'The job title of the designation',
    example: 'Senior Software Engineer',
    minLength: 2,
    maxLength: 120,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  title: string;

  @ApiProperty({
    description: 'UUID of the department this designation belongs to',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @ApiProperty({
    description: 'A brief description of the designation responsibilities',
    example: 'Responsible for leading the development of core services.',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateDesignationDto extends PartialType(CreateDesignationDto) {}

export class DesignationResponseDto extends CreateDesignationDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440005' })
  id: string;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: 'active' })
  status: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  updatedAt: Date;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440006', required: false, nullable: true })
  createdBy: string | null;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440007', required: false, nullable: true })
  updatedBy: string | null;
}

export class DesignationDeleteResponseDto {
  @ApiProperty({ example: 'Designation deleted successfully' })
  message: string;
}
