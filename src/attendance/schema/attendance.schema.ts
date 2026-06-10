import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { Base } from '../../common/schema/base.schema';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/schema/users.schema';
import { Shift } from '../../shifts/schema/shift.schema';

export enum AttendanceStatus {
  PRESENT = 'present',
  ABSENT = 'absent',
  LATE = 'late',
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
  @ManyToOne(() => User, (user) => user.attendanceRecords)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ApiProperty({ description: 'User UUID', example: 'u1v2w3x4-y5z6-7a8b-c9d0-e1f2g3h4i5j6' })
  @Column({ type: 'varchar', length: 36 })
  userId: string;

  // calendar day this record represents (YYYY-MM-DD)
  @ApiProperty({ description: 'Date of attendance', example: '2024-06-09' })
  @Column({ type: 'date' })
  date: string;

  @ManyToOne(() => Shift, (shift) => shift.attendanceRecords)
  @JoinColumn({ name: 'shiftId' })
  shift: Shift;

  @ApiProperty({ description: 'Shift UUID', example: 's1h2i3f4-t5u6-7v8w-x9y0-z1a2b3c4d5e6', nullable: true })
  @Column({ type: 'varchar', length: 36, nullable: true, default: null })
  shiftId: string;

  @ApiProperty({ description: 'Check-in time', example: '2024-06-09T09:00:00Z', nullable: true })
  @Column({ type: 'datetime', nullable: true, default: null })
  checkInAt: Date;

  @ApiProperty({ description: 'Check-out time', example: '2024-06-09T18:00:00Z', nullable: true })
  @Column({ type: 'datetime', nullable: true, default: null })
  checkOutAt: Date;

  @ApiProperty({ description: 'Attendance status', enum: AttendanceStatus })
  @Column({
    type: 'enum',
    enum: AttendanceStatus,
    default: AttendanceStatus.ABSENT,
  })
  attendanceStatus: AttendanceStatus;

  @ApiProperty({ description: 'Total worked minutes', example: 540 })
  @Column({ type: 'int', default: 0 })
  workedMinutes: number;

  @ApiProperty({ description: 'Overtime minutes', example: 60 })
  @Column({ type: 'int', default: 0 })
  overtimeMinutes: number;

  @ApiProperty({ description: 'Late arrival minutes', example: 15 })
  @Column({ type: 'int', default: 0 })
  lateMinutes: number;

  @ApiProperty({ description: 'Early leave minutes', example: 0 })
  @Column({ type: 'int', default: 0 })
  earlyLeaveMinutes: number;

  @ApiProperty({ description: 'Source of attendance record', enum: AttendanceSource })
  @Column({
    type: 'enum',
    enum: AttendanceSource,
    default: AttendanceSource.SYSTEM,
  })
  source: AttendanceSource;

  @ApiProperty({ description: 'Remarks or notes', example: 'Regular day', nullable: true })
  @Column({ type: 'text', nullable: true })
  remarks: string;
}
