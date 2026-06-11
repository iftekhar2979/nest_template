import { Column, Entity, Index } from 'typeorm';
import { Base } from '../../common/schema/base.schema';

export enum NotificationType {
  GENERAL = 'general',
  ATTENDANCE = 'attendance',
  REQUEST = 'request',
  SHIFT = 'shift',
  LEAVE = 'leave',
  ESCALATION = 'escalation',
}

@Entity('notifications')
@Index('idx_notification_user_read', ['userId', 'isRead'])
export class Notification extends Base {
  @Column({ type: 'varchar', length: 36 })
  userId: string;

  @Column({ type: 'enum', enum: NotificationType, default: NotificationType.GENERAL })
  type: NotificationType;

  @Column({ type: 'varchar' })
  title: string;

  @Column({ type: 'text' })
  message: string;

  // optional structured payload (entity ids etc.) as JSON string
  @Column({ type: 'text', nullable: true })
  data: string;

  @Column({ type: 'boolean', default: false })
  isRead: boolean;

  @Column({ type: 'datetime', nullable: true, default: null })
  readAt: Date;
}
