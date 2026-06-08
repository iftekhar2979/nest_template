import { Column, Entity, Index } from 'typeorm';
import { Base } from '../../common/schema/base.schema';

export enum Weekday {
  SUN = 'sun',
  MON = 'mon',
  TUE = 'tue',
  WED = 'wed',
  THU = 'thu',
  FRI = 'fri',
  SAT = 'sat',
}

@Entity('work_week_patterns')
@Index('idx_work_week_company', ['companyId'])
export class WorkWeekPattern extends Base {
  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar', length: 36, nullable: true, default: null })
  companyId: string;

  @Column({ type: 'simple-json' })
  workingDays: Weekday[];

  @Column({ type: 'simple-json' })
  weeklyOffDays: Weekday[];

  @Column({ type: 'varchar', length: 36, nullable: true, default: null })
  defaultShiftId: string;

  @Column({ type: 'text', nullable: true })
  description: string;
}
