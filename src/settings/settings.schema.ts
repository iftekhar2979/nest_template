import { Column, Entity } from 'typeorm';
import { Base } from '../common/schema/base.schema';

@Entity('settings')
export class Settings extends Base {
  @Column({ type: 'varchar' })
  key: string;

  @Column({ type: 'text' })
  content: string;
}
