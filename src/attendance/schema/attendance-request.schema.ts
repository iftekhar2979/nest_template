import { Column, Entity, Index } from 'typeorm';
import { Base } from '../../common/schema/base.schema';
import { AttendanceStatus } from './attendance.schema';
import { ApiProperty } from '@nestjs/swagger';

export enum RequestType {
  MISSED_CHECK_IN = 'missed_check_in',
  MISSED_CHECK_OUT = 'missed_check_out',
  MANUAL_ATTENDANCE = 'manual_attendance',
  ABSENCE = 'absence',
  OVERTIME = 'overtime',
}

export enum RequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

@Entity('attendance_requests')
@Index('idx_request_user', ['userId'])
@Index('idx_request_status', ['requestStatus'])
export class AttendanceRequest extends Base {
  @ApiProperty({ description: 'User UUID', example: 'u1v2w3x4-y5z6-7a8b-c9d0-e1f2g3h4i5j6' })
  @Column({ type: 'varchar', length: 36 })
  userId: string;

  @ApiProperty({ description: 'Type of request', enum: RequestType })
  @Column({ type: 'enum', enum: RequestType })
  type: RequestType;

  @ApiProperty({ description: 'Date of attendance', example: '2024-06-09' })
  @Column({ type: 'date' })
  date: string;

  @ApiProperty({ description: 'Requested check-in time', example: '2024-06-09T09:00:00Z', nullable: true })
  @Column({ type: 'datetime', nullable: true, default: null })
  requestedCheckInAt: Date;

  @ApiProperty({ description: 'Requested check-out time', example: '2024-06-09T18:00:00Z', nullable: true })
  @Column({ type: 'datetime', nullable: true, default: null })
  requestedCheckOutAt: Date;

  @ApiProperty({ description: 'Requested attendance status', enum: AttendanceStatus, nullable: true })
  @Column({
    type: 'enum',
    enum: AttendanceStatus,
    nullable: true,
    default: null,
  })
  requestedStatus: AttendanceStatus;

  @ApiProperty({ description: 'Reason for request', example: 'Forgot to swipe' })
  @Column({ type: 'text' })
  reason: string;

  @ApiProperty({ description: 'URL to evidence', example: 'https://example.com/img.jpg', nullable: true })
  @Column({ type: 'varchar', nullable: true, default: null })
  evidenceUrl: string;

  @ApiProperty({ description: 'Current status of request', enum: RequestStatus })
  @Column({
    type: 'enum',
    enum: RequestStatus,
    default: RequestStatus.PENDING,
  })
  requestStatus: RequestStatus;

  @ApiProperty({ description: 'User UUID of reviewer', example: 'r1v2w3x4...', nullable: true })
  @Column({ type: 'varchar', length: 36, nullable: true, default: null })
  reviewedBy: string;

  @ApiProperty({ description: 'Review timestamp', example: '2024-06-10T10:00:00Z', nullable: true })
  @Column({ type: 'datetime', nullable: true, default: null })
  reviewedAt: Date;

  @ApiProperty({ description: 'Reviewer note', example: 'Approved.', nullable: true })
  @Column({ type: 'text', nullable: true })
  reviewNote: string;
}
