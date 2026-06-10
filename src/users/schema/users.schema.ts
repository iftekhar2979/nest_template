import { BeforeInsert, Column, Entity, Index, OneToMany, OneToOne } from 'typeorm';
import * as argon2 from 'argon2';
import { Base } from '../../common/schema/base.schema';
import { AttendanceRecord } from '../../attendance/schema/attendance.schema';
import { AttendancePunch } from '../../attendance/schema/attendance-punch.schema';
import { AttendanceRequest } from '../../attendance/schema/attendance-request.schema';
import { Employee } from '../../employees/schema/employee.schema';

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
  @Index('idx_users_email', { unique: true })
  @Column({ type: 'varchar', unique: true })
  email: string;

  @Column({ type: 'varchar', select: false })
  passwordHash: string;

  @Column({ type: 'varchar', nullable: true })
  phoneNumber: string;

  @Column({ type: 'varchar' })
  fullName: string;

  @Column({ type: 'varchar', default: '' })
  avatarUrl: string;

  @Column({ type: 'boolean', default: false })
  isEmailVerified: boolean;

  @Column({ type: 'boolean', default: false })
  isTcPpAccepted: boolean;

  @Column({ type: 'datetime', nullable: true, default: null })
  emailVerifiedAt: Date;

  @Column({ type: 'varchar', length: 36, nullable: true, default: null })
  activePlanId: string;

  @Column({ type: 'varchar', nullable: true })
  subscriptionStatus: string; // active | expired | cancelled | trialing

  @Column({ type: 'datetime', nullable: true, default: null })
  accessExpiresAt: Date;

  @Column({ type: 'enum', enum: RoleType, default: RoleType.CLIENT })
  role: RoleType;

  @Column({ type: 'varchar', length: 36, nullable: true, default: null })
  teamId: string;

  @Column({ type: 'varchar', length: 36, nullable: true, default: null })
  departmentId: string;

  @Column({ type: 'varchar', nullable: true })
  timezone: string;

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
