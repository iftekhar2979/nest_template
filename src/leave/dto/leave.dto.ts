import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { LeaveAccrualMethod } from '../schema/leave-type.schema';
import { PaginationDto } from '../../shared/dto/pagination.dto';

// --- Leave types ---

export class CreateLeaveTypeDto {
  @ApiProperty({ description: 'Unique code', example: 'annual' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  code: string;

  @ApiProperty({ description: 'Display name', example: 'Annual Leave' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name: string;

  @ApiPropertyOptional({ description: 'Whether the leave is paid', default: true })
  @IsOptional()
  @IsBoolean()
  isPaid?: boolean;

  @ApiProperty({ description: 'Annual entitlement in days', example: 24 })
  @IsNumber()
  @Min(0)
  annualEntitlementDays: number;

  @ApiPropertyOptional({ description: 'Accrual method', enum: LeaveAccrualMethod })
  @IsOptional()
  @IsEnum(LeaveAccrualMethod)
  accrualMethod?: LeaveAccrualMethod;

  @ApiPropertyOptional({ description: 'Allow carry-forward to next year', default: false })
  @IsOptional()
  @IsBoolean()
  allowCarryForward?: boolean;

  @ApiPropertyOptional({ description: 'Max days carried forward', example: 5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxCarryForwardDays?: number;

  @ApiPropertyOptional({ description: 'Description' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateLeaveTypeDto extends PartialType(CreateLeaveTypeDto) {}

// --- Allocation ---

export class AllocateLeaveDto {
  @ApiProperty({ description: 'Employee UUID' })
  @IsUUID()
  employeeId: string;

  @ApiProperty({ description: 'Leave type UUID' })
  @IsUUID()
  leaveTypeId: string;

  @ApiProperty({ description: 'Allocation year', example: 2024 })
  @IsInt()
  @Min(2000)
  @Max(2100)
  year: number;

  @ApiPropertyOptional({
    description:
      'Total allocated days. Defaults to the leave type annual entitlement.',
    example: 24,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalAllocatedDays?: number;

  @ApiPropertyOptional({ description: 'Validity start (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({ description: 'Validity end (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  toDate?: string;
}

// --- Accrual run ---

export class RunAccrualDto {
  @ApiProperty({ description: 'Accrual year', example: 2024 })
  @IsInt()
  @Min(2000)
  @Max(2100)
  year: number;

  @ApiProperty({ description: 'Accrual month (1-12)', example: 3 })
  @IsInt()
  @Min(1)
  @Max(12)
  month: number;
}

// --- Manual ledger transaction (usage / encashment / adjustment) ---

export enum LeaveTransactionType {
  USAGE = 'usage',
  ENCASHMENT = 'encashment',
  ADJUSTMENT = 'adjustment',
}

export class LeaveTransactionDto {
  @ApiProperty({ description: 'Employee UUID' })
  @IsUUID()
  employeeId: string;

  @ApiProperty({ description: 'Leave type UUID' })
  @IsUUID()
  leaveTypeId: string;

  @ApiProperty({ description: 'Transaction type', enum: LeaveTransactionType })
  @IsEnum(LeaveTransactionType)
  type: LeaveTransactionType;

  @ApiProperty({
    description:
      'Signed days. Debits (usage/encashment) should be negative; adjustments may be +/-.',
    example: -1.5,
  })
  @IsNumber()
  amountDays: number;

  @ApiProperty({ description: 'Effective date (YYYY-MM-DD)', example: '2024-03-15' })
  @IsDateString()
  entryDate: string;

  @ApiPropertyOptional({ description: 'Note / reason' })
  @IsOptional()
  @IsString()
  note?: string;
}

// --- Queries ---

export class QueryAllocationDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filter by employee UUID' })
  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @ApiPropertyOptional({ description: 'Filter by leave type UUID' })
  @IsOptional()
  @IsUUID()
  leaveTypeId?: string;

  @ApiPropertyOptional({ description: 'Filter by year', example: 2024 })
  @IsOptional()
  @IsInt()
  year?: number;
}

export class QueryLedgerDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filter by leave type UUID' })
  @IsOptional()
  @IsUUID()
  leaveTypeId?: string;

  @ApiPropertyOptional({ description: 'Filter by year', example: 2024 })
  @IsOptional()
  @IsInt()
  year?: number;
}

// --- Responses ---

export class LeaveBalanceDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  leaveTypeId: string;

  @ApiProperty({ example: 'annual' })
  code: string;

  @ApiProperty({ example: 'Annual Leave' })
  name: string;

  @ApiProperty({ example: 18.5, description: 'Current remaining balance in days' })
  balanceDays: number;
}
