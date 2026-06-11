import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { Base } from '../../common/schema/base.schema';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/schema/users.schema';
import { Employee } from '../../employees/schema/employee.schema';
import { LeaveType } from './leave-type.schema';

/**
 * Annual entitlement granted to an employee for a leave type. One row per
 * (employee, leaveType, year). The actual running balance lives in the ledger.
 */
@Entity('leave_allocations')
@Index('idx_leave_alloc_unique', ['employeeId', 'leaveTypeId', 'year'], {
  unique: true,
})
export class LeaveAllocation extends Base {
  @ApiProperty({ description: 'Employee UUID', example: 'e1f2g3h4-i5j6-7k8l-m9n0-o1p2q3r4s5t6' })
  @Column({ type: 'varchar', length: 36 })
  employeeId: string;

  @ManyToOne(() => Employee, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employeeId' })
  employee: Employee;

  @ApiProperty({ description: 'User UUID', example: 'u1v2w3x4-y5z6-7a8b-c9d0-e1f2g3h4i5j6' })
  @Column({ type: 'varchar', length: 36 })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ApiProperty({ description: 'Leave Type UUID', example: 'l1t2u3v4-w5x6-7y8z-a9b0-c1d2e3f4g5h6' })
  @Column({ type: 'varchar', length: 36 })
  leaveTypeId: string;

  @ManyToOne(() => LeaveType, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'leaveTypeId' })
  leaveType: LeaveType;

  @ApiProperty({ description: 'Allocation year', example: 2024 })
  @Column({ type: 'int' })
  year: number;

  @ApiProperty({ description: 'Total allocated days', example: '24.00' })
  @Column({ type: 'decimal', precision: 6, scale: 2 })
  totalAllocatedDays: string;

  @ApiProperty({ description: 'Validity start date', example: '2024-01-01', nullable: true })
  @Column({ type: 'date', nullable: true, default: null })
  fromDate: string | null;

  @ApiProperty({ description: 'Validity end date', example: '2024-12-31', nullable: true })
  @Column({ type: 'date', nullable: true, default: null })
  toDate: string | null;
}
