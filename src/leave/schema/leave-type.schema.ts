import { Column, Entity, Index } from 'typeorm';
import { Base } from '../../common/schema/base.schema';

export enum LeaveAccrualMethod {
  // Full entitlement credited up front when an allocation is created
  ANNUAL_LUMP = 'annual_lump',
  // entitlement / 12 credited each month by the accrual run
  MONTHLY_ACCRUAL = 'monthly_accrual',
}

@Entity('leave_types')
export class LeaveType extends Base {
  @Index('idx_leave_type_code', { unique: true })
  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ type: 'boolean', default: true })
  isPaid: boolean;

  // Annual entitlement in days (supports half-days)
  @Column({ type: 'decimal', precision: 6, scale: 2, default: 0 })
  annualEntitlementDays: string;

  @Column({
    type: 'enum',
    enum: LeaveAccrualMethod,
    default: LeaveAccrualMethod.ANNUAL_LUMP,
  })
  accrualMethod: LeaveAccrualMethod;

  @Column({ type: 'boolean', default: false })
  allowCarryForward: boolean;

  @Column({ type: 'decimal', precision: 6, scale: 2, nullable: true, default: null })
  maxCarryForwardDays: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;
}
