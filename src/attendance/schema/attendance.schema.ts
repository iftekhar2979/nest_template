import { Column, Entity, Index } from 'typeorm';
import { Base } from '../../common/schema/base.schema';

export enum AttendanceStatus {
  PRESENT = 'present',
  ABSENT = 'absent',
  HALF_DAY = 'half_day',
  ON_LEAVE = 'on_leave',
  HOLIDAY = 'holiday',
  WEEKLY_OFF = 'weekly_off',
}

export enum AttendanceSource {
  BIOMETRIC = 'biometric',
  WEB = 'web',
  MOBILE = 'mobile',
  MANUAL = 'manual',
  REGULARIZATION = 'regularization',
  SYSTEM = 'system',
  IMPORT = 'import',
}

@Entity('attendance_records')
@Index('idx_attendance_user_date', ['userId', 'date'], { unique: true })
@Index('idx_attendance_date', ['date'])
export class AttendanceRecord extends Base {
  @Column({ type: 'varchar', length: 36 })
  userId: string;

  // calendar day this record represents (YYYY-MM-DD)
  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'varchar', length: 36, nullable: true, default: null })
  shiftId: string;

  @Column({ type: 'datetime', nullable: true, default: null })
  checkInAt: Date;

  @Column({ type: 'datetime', nullable: true, default: null })
  checkOutAt: Date;

  @Column({
    type: 'enum',
    enum: AttendanceStatus,
    default: AttendanceStatus.ABSENT,
  })
  attendanceStatus: AttendanceStatus;

  @Column({ type: 'int', default: 0 })
  workedMinutes: number;

  @Column({ type: 'int', default: 0 })
  overtimeMinutes: number;

  @Column({ type: 'int', default: 0 })
  lateMinutes: number;

  @Column({ type: 'int', default: 0 })
  earlyLeaveMinutes: number;

  @Column({
    type: 'enum',
    enum: AttendanceSource,
    default: AttendanceSource.SYSTEM,
  })
  source: AttendanceSource;

  @Column({ type: 'text', nullable: true })
  remarks: string;
}
