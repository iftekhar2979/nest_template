import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsArray,
  ArrayMinSize,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Min,
  MinLength,
} from 'class-validator';
import { ShiftType } from '../schema/shift.schema';
import {
  PaginationDto,
  SortOrder,
  ToBoolean,
} from '../../shared/dto/pagination.dto';

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

export class CreateShiftDto {
  @ApiProperty({ description: 'The unique name of the shift', example: 'Morning Shift' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ description: 'The category of the shift', enum: ShiftType, default: ShiftType.FIXED })
  @IsOptional()
  @IsEnum(ShiftType)
  type?: ShiftType;

  @ApiProperty({ description: 'Shift start time in HH:mm (24h) format', example: '09:00' })
  @Matches(TIME_REGEX, { message: 'startTime must be in HH:mm format' })
  startTime: string;

  @ApiProperty({ description: 'Shift end time in HH:mm (24h) format', example: '17:00' })
  @Matches(TIME_REGEX, { message: 'endTime must be in HH:mm format' })
  endTime: string;

  @ApiProperty({ description: 'Allowed late arrival in minutes', example: 15, default: 0, required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  graceInMinutes?: number;

  @ApiProperty({ description: 'Allowed early departure in minutes', example: 15, default: 0, required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  graceOutMinutes?: number;

  @ApiProperty({ description: 'Minimum minutes required for a full day attendance', example: 480, default: 480, required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  fullDayMinutes?: number;

  @ApiProperty({ description: 'Minimum minutes required for a half day attendance', example: 240, default: 240, required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  halfDayMinutes?: number;

  @ApiProperty({ description: 'Unpaid break duration in minutes', example: 60, default: 0, required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  breakMinutes?: number;

  @ApiProperty({ description: 'Whether the shift spans across midnight', example: false, default: false, required: false })
  @IsOptional()
  @IsBoolean()
  isOvernight?: boolean;

  @ApiProperty({ description: 'Detailed description of the shift policy', example: 'Standard morning shift with 1h lunch break.', required: false })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateShiftDto extends PartialType(CreateShiftDto) {}

export class AssignShiftDto {
  @ApiProperty({ description: 'UUID of the user to assign the shift to', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  userId: string;

  @ApiProperty({ description: 'UUID of the shift to be assigned', example: '550e8400-e29b-41d4-a716-446655440001' })
  @IsUUID()
  shiftId: string;

  @ApiProperty({ description: 'The date from which the assignment starts (YYYY-MM-DD)', example: '2024-06-01' })
  @IsDateString()
  effectiveFrom: string;

  @ApiProperty({ description: 'Optional end date for the assignment (YYYY-MM-DD)', example: '2024-12-31', required: false })
  @IsOptional()
  @IsDateString()
  effectiveTo?: string;
}

export class BulkAssignShiftDto {
  @ApiProperty({ description: 'UUID of the shift to be assigned', example: '550e8400-e29b-41d4-a716-446655440001' })
  @IsUUID()
  shiftId: string;

  @ApiProperty({ description: 'Array of user UUIDs for bulk assignment', example: ['550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440002'] })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  userIds: string[];

  @ApiProperty({ description: 'The date from which the assignment starts (YYYY-MM-DD)', example: '2024-06-01' })
  @IsDateString()
  effectiveFrom: string;

  @ApiProperty({ description: 'Optional end date for the assignment (YYYY-MM-DD)', example: '2024-12-31', required: false })
  @IsOptional()
  @IsDateString()
  effectiveTo?: string;
}

export class ShiftResponseDto extends CreateShiftDto {
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

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440006', nullable: true })
  createdBy: string | null;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440007', nullable: true })
  updatedBy: string | null;
}

export class ShiftAssignmentResponseDto extends AssignShiftDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440008' })
  id: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440006', nullable: true })
  createdBy: string | null;
}

export class BulkAssignResponseDto {
  @ApiProperty({ description: 'Number of successfully assigned shifts', example: 10 })
  assigned: number;
}

export class ShiftDeleteResponseDto {
  @ApiProperty({ example: 'Shift deleted successfully' })
  message: string;
}

export class ShiftAssignmentDeleteResponseDto {
  @ApiProperty({ example: 'Shift assignment removed successfully' })
  message: string;
}

export enum ShiftSortBy {
  NAME = 'name',
  CREATED_AT = 'createdAt',
}

export class QueryShiftDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Search by shift name', example: 'morning' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by shift type', enum: ShiftType })
  @IsOptional()
  @IsEnum(ShiftType)
  type?: ShiftType;

  @ApiPropertyOptional({ description: 'Filter by overnight flag' })
  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  isOvernight?: boolean;

  @ApiPropertyOptional({ enum: ShiftSortBy, default: ShiftSortBy.NAME })
  @IsOptional()
  @IsEnum(ShiftSortBy)
  sortBy?: ShiftSortBy;

  @ApiPropertyOptional({ enum: SortOrder, default: SortOrder.ASC })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder;
}
