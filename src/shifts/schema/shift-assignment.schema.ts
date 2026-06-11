import { Column, Entity, Index } from 'typeorm';
import { Base } from '../../common/schema/base.schema';

@Entity('shift_assignments')
@Index('idx_shift_assignment_user_from', ['userId', 'effectiveFrom'])
export class ShiftAssignment extends Base {
  @Column({ type: 'varchar', length: 36 })
  userId: string;

  @Column({ type: 'varchar', length: 36 })
  shiftId: string;

  @Column({ type: 'date' })
  effectiveFrom: string;

  // null = open-ended assignment
  @Column({ type: 'date', nullable: true, default: null })
  effectiveTo: string;
}
