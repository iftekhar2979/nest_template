import { Column, Entity, Index } from 'typeorm';
import { Base } from '../../common/schema/base.schema';

@Entity('designations')
export class Designation extends Base {
  @Column({ type: 'varchar' })
  title: string;

  @Index('idx_designation_department')
  @Column({ type: 'varchar', length: 36, nullable: true, default: null })
  departmentId: string;

  @Column({ type: 'text', nullable: true })
  description: string;
}
