import { PartialType } from '@nestjs/swagger';
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

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

export class CreateShiftDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsOptional()
  @IsEnum(ShiftType)
  type?: ShiftType;

  @Matches(TIME_REGEX, { message: 'startTime must be in HH:mm format' })
  startTime: string;

  @Matches(TIME_REGEX, { message: 'endTime must be in HH:mm format' })
  endTime: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  graceInMinutes?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  graceOutMinutes?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  fullDayMinutes?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  halfDayMinutes?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  breakMinutes?: number;

  @IsOptional()
  @IsBoolean()
  isOvernight?: boolean;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateShiftDto extends PartialType(CreateShiftDto) {}

export class AssignShiftDto {
  @IsUUID()
  userId: string;

  @IsUUID()
  shiftId: string;

  @IsDateString()
  effectiveFrom: string;

  @IsOptional()
  @IsDateString()
  effectiveTo?: string;
}

export class BulkAssignShiftDto {
  @IsUUID()
  shiftId: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  userIds: string[];

  @IsDateString()
  effectiveFrom: string;

  @IsOptional()
  @IsDateString()
  effectiveTo?: string;
}
