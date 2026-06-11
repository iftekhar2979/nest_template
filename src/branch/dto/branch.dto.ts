import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateBranchDto {
  @ApiProperty({ description: 'Branch name', example: 'New York Office', maxLength: 140 })
  @IsString()
  @MinLength(2)
  @MaxLength(140)
  branchName: string;

  @ApiProperty({ description: 'Owning company UUID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  companyId: string;

  @ApiProperty({ description: 'Branch address', example: '123 Main St, NY', required: false })
  @IsOptional()
  @IsString()
  address?: string;
}

export class UpdateBranchDto extends PartialType(CreateBranchDto) {}

export class BranchResponseDto extends CreateBranchDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440010' })
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

export class BranchDeleteResponseDto {
  @ApiProperty({ example: 'Branch deleted successfully' })
  message: string;
}
