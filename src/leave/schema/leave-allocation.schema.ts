import { Column, Entity, Index } from 'typeorm';
import { Base } from '../../common/schema/base.schema';

/**
 * Annual entitlement granted to an employee for a leave type. One row per
 * (employee, leaveType, year). The actual running balance lives in the ledger.
 */
@Entity('leave_allocations')
@Index('idx_leave_alloc_unique', ['employeeId', 'leaveTypeId', 'year'], {
  unique: true,
})
export class LeaveAllocation extends Base {
  @Column({ type: 'varchar', length: 36 })
  employeeId: string;

  @Column({ type: 'varchar', length: 36 })
  userId: string;

  @Column({ type: 'varchar', length: 36 })
  leaveTypeId: string;

  @Column({ type: 'int' })
  year: number;

  @Column({ type: 'decimal', precision: 6, scale: 2 })
  totalAllocatedDays: string;

  @Column({ type: 'date', nullable: true, default: null })
  fromDate: string | null;

  @Column({ type: 'date', nullable: true, default: null })
  toDate: string | null;
}
