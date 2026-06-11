import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import {
  PaginationDto,
  SortOrder,
  ToBoolean,
} from '../../shared/dto/pagination.dto';

export class CreateHolidayDto {
  @ApiProperty({ description: 'The name of the holiday', example: 'New Year Day' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ description: 'The date of the holiday (YYYY-MM-DD)', example: '2024-01-01' })
  @IsDateString()
  date: string;

  @ApiProperty({ description: 'The region scope of the holiday. Use "global" for all regions.', example: 'global', default: 'global' })
  @IsOptional()
  @IsString()
  region?: string;

  @ApiProperty({ description: 'Optional holiday list ID for specific groups', example: 'HL-2024', required: false })
  @IsOptional()
  @IsString()
  holidayListId?: string;

  @ApiProperty({ description: 'Whether the holiday repeats on the same month/day every year', example: true, default: false })
  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @ApiProperty({ description: 'Detailed description of the holiday', example: 'National public holiday for New Year celebration.', required: false })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateHolidayDto extends PartialType(CreateHolidayDto) {}

export class HolidayResponseDto extends CreateHolidayDto {
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

export class HolidayDeleteResponseDto {
  @ApiProperty({ example: 'Holiday deleted successfully' })
  message: string;
}

export enum HolidaySortBy {
  DATE = 'date',
  NAME = 'name',
  CREATED_AT = 'createdAt',
}

export class QueryHolidayDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Search by holiday name', example: 'new year' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by region', example: 'global' })
  @IsOptional()
  @IsString()
  region?: string;

  @ApiPropertyOptional({ description: 'Filter by holiday list ID', example: 'HL-2024' })
  @IsOptional()
  @IsString()
  holidayListId?: string;

  @ApiPropertyOptional({ description: 'Filter by recurring flag' })
  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  isRecurring?: boolean;

  @ApiPropertyOptional({ description: 'Start of date range (YYYY-MM-DD)', example: '2024-01-01' })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({ description: 'End of date range (YYYY-MM-DD)', example: '2024-12-31' })
  @IsOptional()
  @IsDateString()
  toDate?: string;

  @ApiPropertyOptional({ enum: HolidaySortBy, default: HolidaySortBy.DATE })
  @IsOptional()
  @IsEnum(HolidaySortBy)
  sortBy?: HolidaySortBy;

  @ApiPropertyOptional({ enum: SortOrder, default: SortOrder.ASC })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder;
}
