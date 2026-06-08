import { PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateHolidayDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsDateString()
  date: string;

  @IsOptional()
  @IsString()
  region?: string;

  @IsOptional()
  @IsString()
  holidayListId?: string;

  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateHolidayDto extends PartialType(CreateHolidayDto) {}
