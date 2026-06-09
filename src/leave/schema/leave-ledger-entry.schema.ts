import { Column, Entity, Index } from 'typeorm';
import { Base } from '../../common/schema/base.schema';
import { ApiProperty } from '@nestjs/swagger';

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
  @ApiProperty({ description: 'Employee UUID', example: 'e1f2g3h4-i5j6-7k8l-m9n0-o1p2q3r4s5t6' })
  @Column({ type: 'varchar', length: 36 })
  employeeId: string;

  @ApiProperty({ description: 'User UUID', example: 'u1v2w3x4-y5z6-7a8b-c9d0-e1f2g3h4i5j6' })
  @Column({ type: 'varchar', length: 36 })
  userId: string;

  @ApiProperty({ description: 'Leave Type UUID', example: 'l1t2u3v4-w5x6-7y8z-a9b0-c1d2e3f4g5h6' })
  @Column({ type: 'varchar', length: 36 })
  leaveTypeId: string;

  @ApiProperty({ description: 'Entry type', enum: LeaveLedgerType })
  @Column({ type: 'enum', enum: LeaveLedgerType })
  entryType: LeaveLedgerType;

  // Signed: credits positive, debits negative
  @ApiProperty({ description: 'Amount of days (signed)', example: '-1.50' })
  @Column({ type: 'decimal', precision: 6, scale: 2 })
  amountDays: string;

  @ApiProperty({ description: 'Effective date', example: '2024-03-15' })
  @Column({ type: 'date' })
  entryDate: string;

  @ApiProperty({ description: 'Year', example: 2024 })
  @Column({ type: 'int' })
  year: number;

  // Dedupe/trace key, e.g. `${allocationId}:2024-03` for monthly accrual
  @ApiProperty({ description: 'Reference ID for tracing', example: 'alloc123:2024-03', nullable: true })
  @Column({ type: 'varchar', length: 80, nullable: true, default: null })
  referenceId: string | null;

  @ApiProperty({ description: 'Note / reason', example: 'Annual leave usage', nullable: true })
  @Column({ type: 'text', nullable: true })
  note: string | null;
}
