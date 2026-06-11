import { Column, Entity, Index } from 'typeorm';
import { Base } from '../../common/schema/base.schema';

@Entity('holidays')
@Index('idx_holiday_date_region', ['date', 'region'])
@Index('idx_holiday_date_list', ['date', 'holidayListId'])
export class Holiday extends Base {
  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'date' })
  date: string;

  // location / region scope; 'global' applies everywhere
  @Column({ type: 'varchar', default: 'global' })
  region: string;

  @Column({ type: 'varchar', nullable: true, default: null })
  holidayListId: string;

  // repeats on the same month/day every year
  @Column({ type: 'boolean', default: false })
  isRecurring: boolean;

  @Column({ type: 'text', nullable: true })
  description: string;
}
