import { Column, Entity, Index } from 'typeorm';
import { Base } from '../../common/schema/base.schema';

@Entity('employee_work_week_assignments')
@Index('idx_work_week_assignment_user_from', ['userId', 'effectiveFrom'])
export class EmployeeWorkWeekAssignment extends Base {
  @Column({ type: 'varchar', length: 36 })
  userId: string;

  @Column({ type: 'varchar', length: 36 })
  employeeId: string;

  @Column({ type: 'varchar', length: 36 })
  workWeekPatternId: string;

  @Column({ type: 'date' })
  effectiveFrom: string;

  @Column({ type: 'date', nullable: true, default: null })
  effectiveTo: string;
}
