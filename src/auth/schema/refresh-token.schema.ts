import { Column, Entity, Index } from 'typeorm';
import { Base } from '../../common/schema/base.schema';

@Entity('refresh_tokens')
@Index('idx_refresh_token_user_active', ['userId', 'isRevoked', 'expiresAt'])
export class RefreshToken extends Base {
  @Index('idx_refresh_token_user_id')
  @Column({ type: 'varchar', length: 36 })
  userId: string;

  @Index('idx_refresh_token_hash', { unique: true })
  @Column({ type: 'varchar', select: false, unique: true })
  tokenHash: string;

  @Column({ type: 'datetime' })
  expiresAt: Date;

  @Column({ type: 'boolean', default: false })
  isRevoked: boolean;

  @Column({ type: 'datetime', nullable: true, default: null })
  revokedAt: Date;

  @Column({ type: 'varchar', default: '' })
  replacedByTokenHash: string;

  @Column({ type: 'varchar', default: '' })
  createdByIp: string;

  @Column({ type: 'varchar', default: '' })
  userAgent: string;
}
