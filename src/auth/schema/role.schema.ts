import { Column, Entity, PrimaryColumn } from 'typeorm';
import { RoleType } from '../../users/schema/users.schema';

@Entity('roles')
export class Role {
  @PrimaryColumn({ type: 'enum', enum: RoleType })
  id: RoleType;

  @Column({ type: 'simple-array' })
  permissions: string[];

  @Column({ type: 'varchar', default: '' })
  description: string;
}
