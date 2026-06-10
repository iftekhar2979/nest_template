import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { AttendanceStatus } from '../schema/attendance.schema';
import { PunchSource, PunchType } from '../schema/attendance-punch.schema';
import { RequestType } from '../schema/attendance-request.schema';

// --- Device-agnostic punch ingestion ---

export class PunchDto {
  @ApiProperty({ description: 'UUID of the user', example: 'u1v2w3x4-y5z6-7a8b-c9d0-e1f2g3h4i5j6' })
  @IsUUID()
  userId: string;

  @ApiProperty({ description: 'Type of punch (in/out)', enum: PunchType, example: PunchType.IN })
  @IsEnum(PunchType)
  punchType: PunchType;

  @ApiProperty({ description: 'Timestamp of the punch (ISO 8601)', example: '2024-06-09T08:30:00Z' })
  @IsDateString()
  punchedAt: string;

  @ApiPropertyOptional({
    description: 'Source of the punch',
    enum: PunchSource,
    example: PunchSource.BIOMETRIC,
    default: PunchSource.BIOMETRIC,
  })
  @IsOptional()
  @IsEnum(PunchSource)
  source?: PunchSource;

  @ApiPropertyOptional({ description: 'Identifier of the device', example: 'device-001' })
  @IsOptional()
  @IsString()
  deviceId?: string;

  @ApiPropertyOptional({
    description: 'External ID for idempotency/offline sync',
    example: 'ext-punch-12345',
  })
  @IsOptional()
  @IsString()
  externalId?: string;
}

export class BatchPunchDto {
  @ApiProperty({ type: [PunchDto], description: 'List of punches to record in batch' })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PunchDto)
  punches: PunchDto[];
}

// --- ZKTeco / iclock device ingestion ---

export class ZktecoPunchDto {
  @ApiProperty({ description: 'Employee device PIN (employee number)', example: '1001' })
  @IsString()
  pin: string;

  @ApiProperty({ description: 'Device-local timestamp', example: '2024-06-09 08:30:00' })
  @IsString()
  time: string;

  @ApiPropertyOptional({ description: 'Device serial number', example: 'SN123456789' })
  @IsOptional()
  @IsString()
  sn?: string;

  @ApiPropertyOptional({ description: 'Device monotonic record index', example: '123' })
  @IsOptional()
  @IsString()
  index?: string;

  @ApiPropertyOptional({
    description: 'Raw device status code (for audit only)',
    example: '0',
  })
  @IsOptional()
  @IsString()
  status?: string;
}

export class ZktecoBatchDto {
  @ApiProperty({ type: [ZktecoPunchDto], description: 'Batch of raw ZKTeco punches' })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ZktecoPunchDto)
  punches: ZktecoPunchDto[];
}

// --- Punch-event webhook (single directional punch) ---

export class PunchEventDto {
  @ApiProperty({
    description: 'User UUID of the employee',
    example: 'u1v2w3x4-y5z6-7a8b-c9d0-e1f2g3h4i5j6',
  })
  @IsString()
  employeeId: string;

  @ApiProperty({ description: 'Punch timestamp (ISO 8601)', example: '2024-06-09T08:30:00Z' })
  @IsDateString()
  timestamp: string;

  @ApiProperty({ description: 'Punch direction', enum: PunchType, example: PunchType.IN })
  @IsEnum(PunchType)
  direction: PunchType;
}

// --- Employee self check-in / check-out ---

export class CheckInOutDto {
  @ApiPropertyOptional({
    description: 'Source of the check-in/out',
    enum: PunchSource,
    example: PunchSource.WEB,
    default: PunchSource.WEB,
  })
  @IsOptional()
  @IsEnum(PunchSource)
  source?: PunchSource;

  @ApiPropertyOptional({
    description: 'Optional timestamp; defaults to current server time',
    example: '2024-06-09T08:30:00Z',
  })
  @IsOptional()
  @IsDateString()
  at?: string;
}

// --- Admin manual correction ---

export class ManualCorrectionDto {
  @ApiProperty({ description: 'UUID of the user', example: 'u1v2w3x4-y5z6-7a8b-c9d0-e1f2g3h4i5j6' })
  @IsUUID()
  userId: string;

  @ApiProperty({ description: 'Date of attendance (YYYY-MM-DD)', example: '2024-06-09' })
  @IsDateString()
  date: string;

  @ApiProperty({
    description: 'New attendance status',
    enum: AttendanceStatus,
    example: AttendanceStatus.PRESENT,
  })
  @IsEnum(AttendanceStatus)
  attendanceStatus: AttendanceStatus;

  @ApiProperty({ description: 'Reason for the manual correction', example: 'Biometric device failure' })
  @IsString()
  @MinLength(3)
  reason: string;

  @ApiPropertyOptional({ description: 'Manual check-in time', example: '2024-06-09T09:00:00Z' })
  @IsOptional()
  @IsDateString()
  checkInAt?: string;

  @ApiPropertyOptional({ description: 'Manual check-out time', example: '2024-06-09T18:00:00Z' })
  @IsOptional()
  @IsDateString()
  checkOutAt?: string;
}

export class BulkCorrectionItemDto {
  @ApiProperty({ description: 'UUID of the user', example: 'u1v2w3x4-y5z6-7a8b-c9d0-e1f2g3h4i5j6' })
  @IsUUID()
  userId: string;

  @ApiProperty({ description: 'Date of attendance', example: '2024-06-09' })
  @IsDateString()
  date: string;

  @ApiProperty({ enum: AttendanceStatus, example: AttendanceStatus.PRESENT })
  @IsEnum(AttendanceStatus)
  attendanceStatus: AttendanceStatus;
}

export class BulkCorrectionDto {
  @ApiProperty({ description: 'Common reason for bulk correction', example: 'Company-wide holiday correction' })
  @IsString()
  @MinLength(3)
  reason: string;

  @ApiProperty({ type: [BulkCorrectionItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => BulkCorrectionItemDto)
  items: BulkCorrectionItemDto[];
}

// --- Querying / export ---

export class AttendanceQueryDto {
  @ApiPropertyOptional({ description: 'Filter from date (YYYY-MM-DD)', example: '2024-06-01' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ description: 'Filter to date (YYYY-MM-DD)', example: '2024-06-30' })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional({ description: 'Search by user name, employee name, or employee code' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by user UUID' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ description: 'Filter by department UUID' })
  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @ApiPropertyOptional({ description: 'Filter by shift UUID' })
  @IsOptional()
  @IsUUID()
  shiftId?: string;

  @ApiPropertyOptional({ description: 'Filter by status', enum: AttendanceStatus })
  @IsOptional()
  @IsEnum(AttendanceStatus)
  status?: AttendanceStatus;

  @ApiPropertyOptional({ description: 'Page number', example: 1, default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', example: 10, default: 10 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1000)
  @Type(() => Number)
  limit?: number = 10;
}

// --- Regularization requests ---

export class CreateAttendanceRequestDto {
  @ApiProperty({ description: 'Type of request', enum: RequestType, example: RequestType.MISSED_CHECK_IN })
  @IsEnum(RequestType)
  type: RequestType;

  @ApiProperty({ description: 'Date for the request', example: '2024-06-09' })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({ description: 'Proposed check-in time', example: '2024-06-09T09:00:00Z' })
  @IsOptional()
  @IsDateString()
  requestedCheckInAt?: string;

  @ApiPropertyOptional({ description: 'Proposed check-out time', example: '2024-06-09T18:00:00Z' })
  @IsOptional()
  @IsDateString()
  requestedCheckOutAt?: string;

  @ApiPropertyOptional({
    description: 'Proposed status',
    enum: AttendanceStatus,
    example: AttendanceStatus.PRESENT,
  })
  @IsOptional()
  @IsEnum(AttendanceStatus)
  requestedStatus?: AttendanceStatus;

  @ApiProperty({ description: 'Detailed reason for the request', example: 'Forgot to swipe card' })
  @IsString()
  @MinLength(3)
  reason: string;

  @ApiPropertyOptional({ description: 'URL to supporting document/image', example: 'https://cdn.example.com/evidence/123.jpg' })
  @IsOptional()
  @IsString()
  evidenceUrl?: string;
}

export class ReviewRequestDto {
  @ApiProperty({ enum: ['approve', 'reject'], example: 'approve' })
  @IsEnum(['approve', 'reject'])
  action: 'approve' | 'reject';

  @ApiPropertyOptional({ description: 'Note from the reviewer', example: 'Valid reason, approved.' })
  @IsOptional()
  @IsString()
  reviewNote?: string;
}
