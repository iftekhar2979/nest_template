import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { User } from '../../users/schema/users.schema';

/**
 * Abstract base entity shared by all domain tables.
 * Provides a UUID primary key, soft-delete (deletedAt) and audit columns.
 * TypeORM automatically excludes soft-deleted rows from queries unless
 * `withDeleted: true` is passed.
 */
export abstract class Base {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'varchar', default: 'active' })
  status: string;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'datetime', nullable: true })
  deletedAt: Date | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  createdBy: string | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  updatedBy: string | null;

  // Relations backed by the createdBy/updatedBy FK columns above, so the
  // creating/updating user can be eagerly joined (relations: ['createdByUser']).
  // String target + `import type` avoids the circular import with User (which
  // itself extends Base).
  @ManyToOne('User', { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'createdBy' })
  createdByUser?: User | null;

  @ManyToOne('User', { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'updatedBy' })
  updatedByUser?: User | null;
}
