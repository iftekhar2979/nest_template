import { Column, Entity, Index } from 'typeorm';
import { Base } from '../../common/schema/base.schema';
import { AttendanceStatus } from './attendance.schema';

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
  @Column({ type: 'varchar', length: 36 })
  userId: string;

  @Column({ type: 'enum', enum: RequestType })
  type: RequestType;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'datetime', nullable: true, default: null })
  requestedCheckInAt: Date;

  @Column({ type: 'datetime', nullable: true, default: null })
  requestedCheckOutAt: Date;

  @Column({
    type: 'enum',
    enum: AttendanceStatus,
    nullable: true,
    default: null,
  })
  requestedStatus: AttendanceStatus;

  @Column({ type: 'text' })
  reason: string;

  @Column({ type: 'varchar', nullable: true, default: null })
  evidenceUrl: string;

  @Column({
    type: 'enum',
    enum: RequestStatus,
    default: RequestStatus.PENDING,
  })
  requestStatus: RequestStatus;

  @Column({ type: 'varchar', length: 36, nullable: true, default: null })
  reviewedBy: string;

  @Column({ type: 'datetime', nullable: true, default: null })
  reviewedAt: Date;

  @Column({ type: 'text', nullable: true })
  reviewNote: string;
}
