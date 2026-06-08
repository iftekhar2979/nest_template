import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { AttendanceStatus } from '../schema/attendance.schema';
import { PunchSource, PunchType } from '../schema/attendance-punch.schema';
import { RequestType } from '../schema/attendance-request.schema';

// --- Device-agnostic punch ingestion ---

export class PunchDto {
  @IsUUID()
  userId: string;

  @IsEnum(PunchType)
  punchType: PunchType;

  @IsDateString()
  punchedAt: string;

  @IsOptional()
  @IsEnum(PunchSource)
  source?: PunchSource;

  @IsOptional()
  @IsString()
  deviceId?: string;

  @IsOptional()
  @IsString()
  externalId?: string;
}

export class BatchPunchDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PunchDto)
  punches: PunchDto[];
}

// --- Employee self check-in / check-out ---

export class CheckInOutDto {
  @IsOptional()
  @IsEnum(PunchSource)
  source?: PunchSource;

  // optional explicit timestamp; defaults to now
  @IsOptional()
  @IsDateString()
  at?: string;
}

// --- Admin manual correction ---

export class ManualCorrectionDto {
  @IsUUID()
  userId: string;

  @IsDateString()
  date: string;

  @IsEnum(AttendanceStatus)
  attendanceStatus: AttendanceStatus;

  // reason is mandatory for the audit trail
  @IsString()
  @MinLength(3)
  reason: string;

  @IsOptional()
  @IsDateString()
  checkInAt?: string;

  @IsOptional()
  @IsDateString()
  checkOutAt?: string;
}

export class BulkCorrectionItemDto {
  @IsUUID()
  userId: string;

  @IsDateString()
  date: string;

  @IsEnum(AttendanceStatus)
  attendanceStatus: AttendanceStatus;
}

export class BulkCorrectionDto {
  @IsString()
  @MinLength(3)
  reason: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => BulkCorrectionItemDto)
  items: BulkCorrectionItemDto[];
}

// --- Querying / export ---

export class AttendanceQueryDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @IsOptional()
  @IsUUID()
  shiftId?: string;

  @IsOptional()
  @IsEnum(AttendanceStatus)
  status?: AttendanceStatus;
}

// --- Regularization requests ---

export class CreateAttendanceRequestDto {
  @IsEnum(RequestType)
  type: RequestType;

  @IsDateString()
  date: string;

  @IsOptional()
  @IsDateString()
  requestedCheckInAt?: string;

  @IsOptional()
  @IsDateString()
  requestedCheckOutAt?: string;

  @IsOptional()
  @IsEnum(AttendanceStatus)
  requestedStatus?: AttendanceStatus;

  @IsString()
  @MinLength(3)
  reason: string;

  @IsOptional()
  @IsString()
  evidenceUrl?: string;
}

export class ReviewRequestDto {
  @IsEnum(['approve', 'reject'])
  action: 'approve' | 'reject';

  @IsOptional()
  @IsString()
  reviewNote?: string;
}
