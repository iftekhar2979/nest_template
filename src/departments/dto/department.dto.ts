import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateDepartmentDto {
  @ApiProperty({
    description: 'Name of the department',
    example: 'Software Engineering',
    minLength: 2,
    maxLength: 140,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(140)
  departmentName: string;

  @ApiProperty({
    description: 'UUID of the parent department for hierarchical structure',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  parentDepartment?: string;

  @ApiProperty({
    description: 'Whether this department is a group/parent node',
    example: false,
    required: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isGroup?: boolean;

  @ApiProperty({
    description: 'UUID of the company this department belongs to',
    example: '550e8400-e29b-41d4-a716-446655440001',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  company?: string;

  @ApiProperty({
    description: 'Whether the department is disabled',
    example: false,
    required: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  disabled?: boolean;

  @ApiProperty({
    description: 'UUID of the leave block list for this department',
    example: '550e8400-e29b-41d4-a716-446655440002',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  leaveBlockList?: string;

  @ApiProperty({
    description: 'UUID of the payroll cost center for this department',
    example: '550e8400-e29b-41d4-a716-446655440003',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  payrollCostCenter?: string;
}

export class UpdateDepartmentDto extends PartialType(CreateDepartmentDto) {}

export class DepartmentResponseDto extends CreateDepartmentDto {
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

export class DepartmentDeleteResponseDto {
  @ApiProperty({ example: 'Department deleted successfully' })
  message: string;
}
