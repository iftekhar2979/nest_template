import { Column, Entity, Index } from 'typeorm';
import { Base } from '../../common/schema/base.schema';
import { ApiProperty } from '@nestjs/swagger';

export enum LeaveAccrualMethod {
  // Full entitlement credited up front when an allocation is created
  ANNUAL_LUMP = 'annual_lump',
  // entitlement / 12 credited each month by the accrual run
  MONTHLY_ACCRUAL = 'monthly_accrual',
}

@Entity('leave_types')
export class LeaveType extends Base {
  @ApiProperty({ description: 'Unique code', example: 'annual' })
  @Index('idx_leave_type_code', { unique: true })
  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @ApiProperty({ description: 'Display name', example: 'Annual Leave' })
  @Column({ type: 'varchar', length: 120 })
  name: string;

  @ApiProperty({ description: 'Whether the leave is paid', example: true })
  @Column({ type: 'boolean', default: true })
  isPaid: boolean;

  // Annual entitlement in days (supports half-days)
  @ApiProperty({ description: 'Annual entitlement in days', example: '24.00' })
  @Column({ type: 'decimal', precision: 6, scale: 2, default: 0 })
  annualEntitlementDays: string;

  @ApiProperty({ description: 'Accrual method', enum: LeaveAccrualMethod })
  @Column({
    type: 'enum',
    enum: LeaveAccrualMethod,
    default: LeaveAccrualMethod.ANNUAL_LUMP,
  })
  accrualMethod: LeaveAccrualMethod;

  @ApiProperty({ description: 'Allow carry-forward to next year', example: false })
  @Column({ type: 'boolean', default: false })
  allowCarryForward: boolean;

  @ApiProperty({
    description: 'Max days carried forward',
    example: '5.00',
    nullable: true,
  })
  @Column({ type: 'decimal', precision: 6, scale: 2, nullable: true, default: null })
  maxCarryForwardDays: string | null;

  @ApiProperty({ description: 'Description', example: 'Regular annual leave entitlement', nullable: true })
  @Column({ type: 'text', nullable: true })
  description: string | null;
}
