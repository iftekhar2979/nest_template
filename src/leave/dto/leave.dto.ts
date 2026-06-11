import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsNumberString,
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
  @ApiProperty({ description: 'Unique code for the leave type', example: 'annual' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  code: string;

  @ApiProperty({ description: 'Display name of the leave type', example: 'Annual Leave' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name: string;

  @ApiPropertyOptional({
    description: 'Whether the leave is paid or unpaid',
    default: true,
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isPaid?: boolean;

  @ApiProperty({ description: 'Total annual entitlement in days', example: 24 })
  @IsNumber()
  @Min(0)
  annualEntitlementDays: number;

  @ApiPropertyOptional({
    description: 'Method by which leave is accrued',
    enum: LeaveAccrualMethod,
    default: LeaveAccrualMethod.ANNUAL_LUMP,
  })
  @IsOptional()
  @IsEnum(LeaveAccrualMethod)
  accrualMethod?: LeaveAccrualMethod;

  @ApiPropertyOptional({
    description: 'Whether unused leave can be carried over to the next year',
    default: false,
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  allowCarryForward?: boolean;

  @ApiPropertyOptional({
    description: 'Maximum number of days that can be carried forward',
    example: 5,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxCarryForwardDays?: number;

  @ApiPropertyOptional({
    description: 'Detailed description of the leave type',
    example: 'Paid time off for holidays and personal use',
  })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateLeaveTypeDto extends PartialType(CreateLeaveTypeDto) {}

// --- Allocation ---

export class AllocateLeaveDto {
  @ApiProperty({
    description: 'ID of the employee to receive the allocation',
    example: 'e1f2g3h4-i5j6-7k8l-m9n0-o1p2q3r4s5t6',
  })
  @IsUUID()
  employeeId: string;

  @ApiProperty({
    description: 'ID of the leave type to allocate',
    example: 'l1t2u3v4-w5x6-7y8z-a9b0-c1d2e3f4g5h6',
  })
  @IsUUID()
  leaveTypeId: string;

  @ApiProperty({ description: 'Year for which the leave is allocated', example: 2024 })
  @IsInt()
  @Min(2000)
  @Max(2100)
  year: number;

  @ApiPropertyOptional({
    description:
      'Total allocated days for the year. Defaults to the leave type annual entitlement.',
    example: 24,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalAllocatedDays?: number;

  @ApiPropertyOptional({
    description: 'The date from which the allocation is valid (YYYY-MM-DD)',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({
    description: 'The date until which the allocation is valid (YYYY-MM-DD)',
    example: '2024-12-31',
  })
  @IsOptional()
  @IsDateString()
  toDate?: string;
}

// --- Accrual run ---

export class RunAccrualDto {
  @ApiProperty({ description: 'Year to run accrual for', example: 2024 })
  @IsInt()
  @Min(2000)
  @Max(2100)
  year: number;

  @ApiProperty({ description: 'Month to run accrual for (1-12)', example: 3 })
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
  @ApiProperty({
    description: 'ID of the employee for the transaction',
    example: 'e1f2g3h4-i5j6-7k8l-m9n0-o1p2q3r4s5t6',
  })
  @IsUUID()
  employeeId: string;

  @ApiProperty({
    description: 'ID of the leave type for the transaction',
    example: 'l1t2u3v4-w5x6-7y8z-a9b0-c1d2e3f4g5h6',
  })
  @IsUUID()
  leaveTypeId: string;

  @ApiProperty({ description: 'Type of transaction', enum: LeaveTransactionType })
  @IsEnum(LeaveTransactionType)
  type: LeaveTransactionType;

  @ApiProperty({
    description:
      'Amount of days. Use negative values for usage/encashment (debits).',
    example: -1.5,
  })
  @IsNumber()
  amountDays: number;

  @ApiProperty({ description: 'Effective date of the transaction (YYYY-MM-DD)', example: '2024-03-15' })
  @IsDateString()
  entryDate: string;

  @ApiPropertyOptional({
    description: 'Note or reason for the transaction',
    example: 'Adjustment for previous month error',
  })
  @IsOptional()
  @IsString()
  note?: string;
}

// --- Queries ---

export class QueryAllocationDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Filter by employee ID',
    example: 'e1f2g3h4-i5j6-7k8l-m9n0-o1p2q3r4s5t6',
  })
  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @ApiPropertyOptional({
    description: 'Filter by leave type ID',
    example: 'l1t2u3v4-w5x6-7y8z-a9b0-c1d2e3f4g5h6',
  })
  @IsOptional()
  @IsUUID()
  leaveTypeId?: string;

  @ApiPropertyOptional({ description: 'Filter by specific year', example: 2024 })
  @IsOptional()
  @IsNumberString()
  year?: string;
}

export class QueryLedgerDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Filter by leave type ID',
    example: 'l1t2u3v4-w5x6-7y8z-a9b0-c1d2e3f4g5h6',
  })
  @IsOptional()
  @IsUUID()
  leaveTypeId?: string;

  @ApiPropertyOptional({ description: 'Filter by specific year', example: 2024 })
  @IsOptional()
  @IsNumberString()
  year?: string;
}

// --- Responses ---

export class LeaveBalanceDto {
  @ApiProperty({
    description: 'ID of the leave type',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  leaveTypeId: string;

  @ApiProperty({ description: 'Unique code of the leave type', example: 'annual' })
  code: string;

  @ApiProperty({ description: 'Display name of the leave type', example: 'Annual Leave' })
  name: string;

  @ApiProperty({
    description: 'Current remaining balance in days',
    example: 18.5,
  })
  balanceDays: number;
}
