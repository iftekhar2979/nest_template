import { Column, Entity, Index } from 'typeorm';
import { Base } from '../../common/schema/base.schema';

export enum DayOverrideType {
  WORKING_DAY = 'working_day',
  WEEKLY_OFF = 'weekly_off',
}

@Entity('employee_day_overrides')
@Index('idx_day_override_user_date', ['userId', 'date'], { unique: true })
@Index('idx_day_override_swap', ['linkedSwapId'])
export class EmployeeDayOverride extends Base {
  @Column({ type: 'varchar', length: 36 })
  userId: string;

  @Column({ type: 'varchar', length: 36 })
  employeeId: string;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'enum', enum: DayOverrideType })
  type: DayOverrideType;

  @Column({ type: 'varchar', length: 36, nullable: true, default: null })
  linkedSwapId: string;

  @Column({ type: 'text' })
  reason: string;
}
