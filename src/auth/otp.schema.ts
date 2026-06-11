import { Column, Entity, Index } from 'typeorm';
import { Base } from '../common/schema/base.schema';

@Entity('otps')
export class Otp extends Base {
  @Index('idx_otp_user_id', { unique: true })
  @Column({ type: 'varchar', length: 36, nullable: true, default: null })
  userID: string;

  @Column({ type: 'varchar', select: false })
  oneTimePassword: string;

  @Column({ type: 'datetime' })
  expiredAt: Date;

  @Column({ type: 'int', default: 0 })
  attempts: number;
}
