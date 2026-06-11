import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
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
  @ApiProperty({
    description: 'Name of the work week pattern',
    example: 'Standard 5-Day Work Week',
  })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiPropertyOptional({
    description: 'Company ID associated with this pattern',
    example: 'd290f1ee-6c54-4b01-90e6-d701748f0851',
  })
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @ApiProperty({
    description: 'List of working days in the pattern',
    enum: Weekday,
    isArray: true,
    example: [Weekday.MON, Weekday.TUE, Weekday.WED, Weekday.THU, Weekday.FRI],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(Weekday, { each: true })
  workingDays: Weekday[];

  @ApiProperty({
    description: 'List of weekly off days in the pattern',
    enum: Weekday,
    isArray: true,
    example: [Weekday.SAT, Weekday.SUN],
  })
  @IsArray()
  @IsEnum(Weekday, { each: true })
  weeklyOffDays: Weekday[];

  @ApiPropertyOptional({
    description: 'Default shift ID for this work week pattern',
    example: 'a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6',
  })
  @IsOptional()
  @IsUUID()
  defaultShiftId?: string;

  @ApiPropertyOptional({
    description: 'Detailed description of the pattern',
    example: 'Standard working hours from Monday to Friday',
  })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateWorkWeekPatternDto extends PartialType(
  CreateWorkWeekPatternDto,
) {}

export class AssignWorkWeekPatternDto {
  @ApiProperty({
    description: 'ID of the user to assign the pattern to',
    example: 'u1v2w3x4-y5z6-7a8b-c9d0-e1f2g3h4i5j6',
  })
  @IsUUID()
  userId: string;

  @ApiProperty({
    description: 'ID of the work week pattern to assign',
    example: 'p1q2r3s4-t5u6-7v8w-x9y0-z1a2b3c4d5e6',
  })
  @IsUUID()
  workWeekPatternId: string;

  @ApiProperty({
    description: 'The date from which this assignment becomes effective',
    example: '2024-01-01',
  })
  @IsDateString()
  effectiveFrom: string;

  @ApiPropertyOptional({
    description: 'The date until which this assignment is effective',
    example: '2024-12-31',
  })
  @IsOptional()
  @IsDateString()
  effectiveTo?: string;
}

export class CreateDayOverrideDto {
  @ApiProperty({
    description: 'ID of the user for whom the day is being overridden',
    example: 'u1v2w3x4-y5z6-7a8b-c9d0-e1f2g3h4i5j6',
  })
  @IsUUID()
  userId: string;

  @ApiProperty({
    description: 'The date of the override',
    example: '2024-05-01',
  })
  @IsDateString()
  date: string;

  @ApiProperty({
    description: 'Type of override (working day or weekly off)',
    enum: DayOverrideType,
    example: DayOverrideType.WORKING_DAY,
  })
  @IsEnum(DayOverrideType)
  type: DayOverrideType;

  @ApiProperty({
    description: 'Reason for the override',
    example: 'Special project requirement',
  })
  @IsString()
  @MinLength(3)
  reason: string;

  @ApiPropertyOptional({
    description: 'Linked swap ID if this override is part of a swap',
    example: 's1t2u3v4-w5x6-7y8z-a9b0-c1d2e3f4g5h6',
  })
  @IsOptional()
  @IsUUID()
  linkedSwapId?: string;
}

export class CreateWeekdaySwapDto {
  @ApiProperty({
    description: 'ID of the user performing the swap',
    example: 'u1v2w3x4-y5z6-7a8b-c9d0-e1f2g3h4i5j6',
  })
  @IsUUID()
  userId: string;

  @ApiProperty({
    description: 'The date which will now be a working day',
    example: '2024-06-08',
  })
  @IsDateString()
  workingDate: string;

  @ApiProperty({
    description: 'The date which will now be a weekly off',
    example: '2024-06-05',
  })
  @IsDateString()
  weeklyOffDate: string;

  @ApiProperty({
    description: 'Reason for the swap',
    example: 'Swapping weekend for a mid-week holiday',
  })
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

  @ApiPropertyOptional({ description: 'Filter by company UUID', example: 'd290f1ee-6c54-4b01-90e6-d701748f0851' })
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @ApiPropertyOptional({
    enum: WorkWeekPatternSortBy,
    default: WorkWeekPatternSortBy.NAME,
    description: 'Field to sort by',
  })
  @IsOptional()
  @IsEnum(WorkWeekPatternSortBy)
  sortBy?: WorkWeekPatternSortBy;

  @ApiPropertyOptional({
    enum: SortOrder,
    default: SortOrder.ASC,
    description: 'Order of sorting',
  })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder;
}
