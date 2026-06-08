import { Column, Entity, Index } from 'typeorm';
import { Base } from '../../common/schema/base.schema';

export enum PunchType {
  IN = 'in',
  OUT = 'out',
}

export enum PunchSource {
  BIOMETRIC = 'biometric',
  WEB = 'web',
  MOBILE = 'mobile',
  MANUAL = 'manual',
}

@Entity('attendance_punches')
@Index('idx_punch_user_time', ['userId', 'punchedAt'])
export class AttendancePunch extends Base {
  @Column({ type: 'varchar', length: 36 })
  userId: string;

  @Column({ type: 'enum', enum: PunchType })
  punchType: PunchType;

  @Column({ type: 'datetime' })
  punchedAt: Date;

  @Column({ type: 'enum', enum: PunchSource, default: PunchSource.BIOMETRIC })
  source: PunchSource;

  @Column({ type: 'varchar', nullable: true, default: null })
  deviceId: string;

  // idempotency key for offline-sync dedupe (unique when provided)
  @Index('idx_punch_external_id', { unique: true })
  @Column({ type: 'varchar', nullable: true, default: null })
  externalId: string;
}
