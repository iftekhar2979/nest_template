import { Column, Entity, Index } from 'typeorm';
import { Base } from '../../common/schema/base.schema';
import { ApiProperty } from '@nestjs/swagger';

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
  @ApiProperty({ description: 'Name of the work week pattern', example: 'Standard' })
  @Column({ type: 'varchar' })
  name: string;

  @ApiProperty({ description: 'Company ID', example: 'd290f1ee-6c54-4b01-90e6-d701748f0851' })
  @Column({ type: 'varchar', length: 36, nullable: true, default: null })
  companyId: string;

  @ApiProperty({ description: 'Working days', enum: Weekday, isArray: true })
  @Column({ type: 'simple-json' })
  workingDays: Weekday[];

  @ApiProperty({ description: 'Weekly off days', enum: Weekday, isArray: true })
  @Column({ type: 'simple-json' })
  weeklyOffDays: Weekday[];

  @ApiProperty({ description: 'Default shift ID', example: 'a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6' })
  @Column({ type: 'varchar', length: 36, nullable: true, default: null })
  defaultShiftId: string;

  @ApiProperty({ description: 'Detailed description', example: 'Standard working hours' })
  @Column({ type: 'text', nullable: true })
  description: string;
}
