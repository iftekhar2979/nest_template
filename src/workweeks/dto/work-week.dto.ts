import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';
import { DayOverrideType } from '../schema/employee-day-override.schema';
import { Weekday } from '../schema/work-week-pattern.schema';
import { PaginationDto, SortOrder } from '../../shared/dto/pagination.dto';

export class CreateWorkWeekPatternDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsOptional()
  @IsUUID()
  companyId?: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(Weekday, { each: true })
  workingDays: Weekday[];

  @IsArray()
  @IsEnum(Weekday, { each: true })
  weeklyOffDays: Weekday[];

  @IsOptional()
  @IsUUID()
  defaultShiftId?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateWorkWeekPatternDto extends PartialType(
  CreateWorkWeekPatternDto,
) {}

export class AssignWorkWeekPatternDto {
  @IsUUID()
  userId: string;

  @IsUUID()
  workWeekPatternId: string;

  @IsDateString()
  effectiveFrom: string;

  @IsOptional()
  @IsDateString()
  effectiveTo?: string;
}

export class CreateDayOverrideDto {
  @IsUUID()
  userId: string;

  @IsDateString()
  date: string;

  @IsEnum(DayOverrideType)
  type: DayOverrideType;

  @IsString()
  @MinLength(3)
  reason: string;

  @IsOptional()
  @IsUUID()
  linkedSwapId?: string;
}

export class CreateWeekdaySwapDto {
  @IsUUID()
  userId: string;

  @IsDateString()
  workingDate: string;

  @IsDateString()
  weeklyOffDate: string;

  @IsString()
  @MinLength(3)
  reason: string;
}

export enum WorkWeekPatternSortBy {
  NAME = 'name',
  CREATED_AT = 'createdAt',
}

export class QueryWorkWeekPatternDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Search by pattern name', example: 'standard' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by company UUID' })
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @ApiPropertyOptional({
    enum: WorkWeekPatternSortBy,
    default: WorkWeekPatternSortBy.NAME,
  })
  @IsOptional()
  @IsEnum(WorkWeekPatternSortBy)
  sortBy?: WorkWeekPatternSortBy;

  @ApiPropertyOptional({ enum: SortOrder, default: SortOrder.ASC })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder;
}
