import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

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
