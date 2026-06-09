import { Column, Entity, Index } from 'typeorm';
import { Base } from '../../common/schema/base.schema';
import { ApiProperty } from '@nestjs/swagger';

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
  @ApiProperty({ description: 'User UUID', example: 'u1v2w3x4-y5z6-7a8b-c9d0-e1f2g3h4i5j6' })
  @Column({ type: 'varchar', length: 36 })
  userId: string;

  @ApiProperty({ description: 'Type of punch (in/out)', enum: PunchType })
  @Column({ type: 'enum', enum: PunchType })
  punchType: PunchType;

  @ApiProperty({ description: 'Timestamp of the punch', example: '2024-06-09T08:30:00Z' })
  @Column({ type: 'datetime' })
  punchedAt: Date;

  @ApiProperty({ description: 'Source of the punch', enum: PunchSource })
  @Column({ type: 'enum', enum: PunchSource, default: PunchSource.BIOMETRIC })
  source: PunchSource;

  @ApiProperty({ description: 'ID of the device', example: 'device-001', nullable: true })
  @Column({ type: 'varchar', nullable: true, default: null })
  deviceId: string;

  // idempotency key for offline-sync dedupe (unique when provided)
  @ApiProperty({ description: 'External ID for deduplication', example: 'ext-punch-12345', nullable: true })
  @Index('idx_punch_external_id', { unique: true })
  @Column({ type: 'varchar', nullable: true, default: null })
  externalId: string;
}
