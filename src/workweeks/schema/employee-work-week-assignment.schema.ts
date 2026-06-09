import { Column, Entity, Index } from 'typeorm';
import { Base } from '../../common/schema/base.schema';
import { ApiProperty } from '@nestjs/swagger';

@Entity('employee_work_week_assignments')
@Index('idx_work_week_assignment_user_from', ['userId', 'effectiveFrom'])
export class EmployeeWorkWeekAssignment extends Base {
  @ApiProperty({ description: 'User UUID', example: 'u1v2w3x4-y5z6-7a8b-c9d0-e1f2g3h4i5j6' })
  @Column({ type: 'varchar', length: 36 })
  userId: string;

  @ApiProperty({ description: 'Employee UUID', example: 'e1f2g3h4-i5j6-7k8l-m9n0-o1p2q3r4s5t6' })
  @Column({ type: 'varchar', length: 36 })
  employeeId: string;

  @ApiProperty({ description: 'Work week pattern UUID', example: 'p1q2r3s4-t5u6-7v8w-x9y0-z1a2b3c4d5e6' })
  @Column({ type: 'varchar', length: 36 })
  workWeekPatternId: string;

  @ApiProperty({ description: 'Effective from date', example: '2024-01-01' })
  @Column({ type: 'date' })
  effectiveFrom: string;

  @ApiProperty({ description: 'Effective to date', example: '2024-12-31', nullable: true })
  @Column({ type: 'date', nullable: true, default: null })
  effectiveTo: string;
}
