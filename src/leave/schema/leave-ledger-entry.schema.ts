import { Column, Entity, Index } from 'typeorm';
import { Base } from '../../common/schema/base.schema';

export enum LeaveLedgerType {
  ALLOCATION = 'allocation', // up-front grant (annual_lump)
  ACCRUAL = 'accrual', // monthly credit (monthly_accrual)
  USAGE = 'usage', // leave taken (debit)
  ENCASHMENT = 'encashment', // paid out (debit)
  CARRY_FORWARD = 'carry_forward', // brought from previous year (credit)
  ADJUSTMENT = 'adjustment', // manual correction (+/-)
}

/**
 * Append-only ledger. An employee's balance for a leave type is the SUM of
 * amountDays across its entries (credits positive, debits negative).
 */
@Entity('leave_ledger_entries')
@Index('idx_leave_ledger_emp_type', ['employeeId', 'leaveTypeId'])
export class LeaveLedgerEntry extends Base {
  @Column({ type: 'varchar', length: 36 })
  employeeId: string;

  @Column({ type: 'varchar', length: 36 })
  userId: string;

  @Column({ type: 'varchar', length: 36 })
  leaveTypeId: string;

  @Column({ type: 'enum', enum: LeaveLedgerType })
  entryType: LeaveLedgerType;

  // Signed: credits positive, debits negative
  @Column({ type: 'decimal', precision: 6, scale: 2 })
  amountDays: string;

  @Column({ type: 'date' })
  entryDate: string;

  @Column({ type: 'int' })
  year: number;

  // Dedupe/trace key, e.g. `${allocationId}:2024-03` for monthly accrual
  @Column({ type: 'varchar', length: 80, nullable: true, default: null })
  referenceId: string | null;

  @Column({ type: 'text', nullable: true })
  note: string | null;
}
