import { BeforeInsert, Column, Entity, Index, OneToMany, OneToOne } from 'typeorm';
import * as argon2 from 'argon2';
import { Base } from '../../common/schema/base.schema';
import { AttendanceRecord } from '../../attendance/schema/attendance.schema';
import { AttendancePunch } from '../../attendance/schema/attendance-punch.schema';
import { AttendanceRequest } from '../../attendance/schema/attendance-request.schema';
import { Employee } from '../../employees/schema/employee.schema';
import { ApiProperty } from '@nestjs/swagger';

export enum RoleType {
  SUPERADMIN = 'superadmin',
  ADMIN = 'admin',
  HTO = 'hto',
  SALES_LEADER = 'sales_leader',
  SALES_TEAM_LEADER = 'sales_team_leader',
  SALES_MEMBER = 'sales_member',
  OPERATION_LEADER = 'operation_leader',
  OPERATION_MEMBER = 'operation_member',
  EMPLOYEE = 'employee',
  CLIENT = 'client',
}

export enum UserStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  DELETED = 'deleted',
}

@Entity('users')
@Index('idx_users_role', ['role'])
@Index('idx_users_team_id', ['teamId'])
@Index('idx_users_dept_id', ['departmentId'])
@Index('idx_users_subscription_lookup', ['subscriptionStatus', 'accessExpiresAt'])
@Index('idx_users_created_at', ['createdAt'])
export class User extends Base {
  @ApiProperty({ example: 'john@example.com' })
  @Index('idx_users_email', { unique: true })
  @Column({ type: 'varchar', unique: true })
  email: string;

  @Column({ type: 'varchar', select: false })
  passwordHash: string;

  @ApiProperty({ example: '+1234567890', nullable: true })
  @Column({ type: 'varchar', nullable: true })
  phoneNumber: string;

  @ApiProperty({ example: 'John Doe' })
  @Column({ type: 'varchar' })
  fullName: string;

  @ApiProperty({ example: 'https://example.com/avatar.jpg' })
  @Column({ type: 'varchar', default: '' })
  avatarUrl: string;

  @ApiProperty({ example: true })
  @Column({ type: 'boolean', default: false })
  isEmailVerified: boolean;

  @ApiProperty({ example: true })
  @Column({ type: 'boolean', default: false })
  isTcPpAccepted: boolean;

  @ApiProperty({ example: '2024-06-10T10:00:00Z', nullable: true })
  @Column({ type: 'datetime', nullable: true, default: null })
  emailVerifiedAt: Date;

  @ApiProperty({ example: 'plan-uuid', nullable: true })
  @Column({ type: 'varchar', length: 36, nullable: true, default: null })
  activePlanId: string;

  @ApiProperty({ example: 'active', nullable: true })
  @Column({ type: 'varchar', nullable: true })
  subscriptionStatus: string; // active | expired | cancelled | trialing

  @ApiProperty({ example: '2025-06-10T10:00:00Z', nullable: true })
  @Column({ type: 'datetime', nullable: true, default: null })
  accessExpiresAt: Date;

  @ApiProperty({ enum: RoleType, example: RoleType.CLIENT })
  @Column({ type: 'enum', enum: RoleType, default: RoleType.CLIENT })
  role: RoleType;

  @ApiProperty({ example: 'team-uuid', nullable: true })
  @Column({ type: 'varchar', length: 36, nullable: true, default: null })
  teamId: string;

  @ApiProperty({ example: 'dept-uuid', nullable: true })
  @Column({ type: 'varchar', length: 36, nullable: true, default: null })
  departmentId: string;

  @ApiProperty({ example: 'Asia/Dhaka', nullable: true })
  @Column({ type: 'varchar', nullable: true })
  timezone: string;

  @ApiProperty({ example: '2024-06-10T10:00:00Z', nullable: true })
  @Column({ type: 'datetime', nullable: true, default: null })
  lastLoginAt: Date;

  @OneToMany(() => AttendanceRecord, (attendance) => attendance.user)
  attendanceRecords: AttendanceRecord[];

  @OneToMany(() => AttendancePunch, (punch) => punch.user)
  attendancePunches: AttendancePunch[];

  @OneToMany(() => AttendanceRequest, (request) => request.user)
  attendanceRequests: AttendanceRequest[];

  @OneToMany(() => AttendanceRequest, (request) => request.reviewer)
  reviewedRequests: AttendanceRequest[];

  @OneToOne(() => Employee, (employee) => employee.user)
  employee: Employee;

  @BeforeInsert()
  normalizeAndHash(): Promise<void> {
    if (this.email) {
      this.email = this.email.toLowerCase().trim();
    }
    if (this.fullName) {
      this.fullName = this.fullName.trim();
    }
    return this.hashPasswordIfPresent();
  }

  private async hashPasswordIfPresent(): Promise<void> {
    if (this.passwordHash) {
      this.passwordHash = await argon2.hash(this.passwordHash);
    }
  }
}
