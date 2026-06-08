import { Column, Entity } from 'typeorm';
import { Base } from '../../common/schema/base.schema';

export enum ShiftType {
  FIXED = 'fixed',
  FLEXIBLE = 'flexible',
  ROTATIONAL = 'rotational',
  SPLIT = 'split',
}

@Entity('shifts')
export class Shift extends Base {
  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'enum', enum: ShiftType, default: ShiftType.FIXED })
  type: ShiftType;

  // 'HH:mm' 24h local time
  @Column({ type: 'varchar', length: 5 })
  startTime: string;

  @Column({ type: 'varchar', length: 5 })
  endTime: string;

  // Late grace after startTime (minutes)
  @Column({ type: 'int', default: 0 })
  graceInMinutes: number;

  // Early-leave grace before endTime (minutes)
  @Column({ type: 'int', default: 0 })
  graceOutMinutes: number;

  // Expected worked minutes for a full day
  @Column({ type: 'int', default: 480 })
  fullDayMinutes: number;

  // Minimum worked minutes to count as a half day
  @Column({ type: 'int', default: 240 })
  halfDayMinutes: number;

  @Column({ type: 'int', default: 0 })
  breakMinutes: number;

  // endTime falls on the next calendar day
  @Column({ type: 'boolean', default: false })
  isOvernight: boolean;

  @Column({ type: 'text', nullable: true })
  description: string;
}
