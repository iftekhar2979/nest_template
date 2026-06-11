import { Column, Entity, Index } from 'typeorm';
import { Base } from '../../common/schema/base.schema';
import { ApiProperty } from '@nestjs/swagger';

export enum DayOverrideType {
  WORKING_DAY = 'working_day',
  WEEKLY_OFF = 'weekly_off',
}

@Entity('employee_day_overrides')
@Index('idx_day_override_user_date', ['userId', 'date'], { unique: true })
@Index('idx_day_override_swap', ['linkedSwapId'])
export class EmployeeDayOverride extends Base {
  @ApiProperty({ description: 'User UUID', example: 'u1v2w3x4-y5z6-7a8b-c9d0-e1f2g3h4i5j6' })
  @Column({ type: 'varchar', length: 36 })
  userId: string;

  @ApiProperty({ description: 'Employee UUID', example: 'e1f2g3h4-i5j6-7k8l-m9n0-o1p2q3r4s5t6' })
  @Column({ type: 'varchar', length: 36 })
  employeeId: string;

  @ApiProperty({ description: 'Date of override', example: '2024-05-01' })
  @Column({ type: 'date' })
  date: string;

  @ApiProperty({ description: 'Override type', enum: DayOverrideType })
  @Column({ type: 'enum', enum: DayOverrideType })
  type: DayOverrideType;

  @ApiProperty({ description: 'Linked swap UUID', example: 's1t2u3v4-w5x6-7y8z-a9b0-c1d2e3f4g5h6', nullable: true })
  @Column({ type: 'varchar', length: 36, nullable: true, default: null })
  linkedSwapId: string;

  @ApiProperty({ description: 'Reason for override', example: 'Special project' })
  @Column({ type: 'text' })
  reason: string;
}
