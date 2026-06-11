import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { Base } from '../../common/schema/base.schema';
import { Company } from '../../company/schema/company.schema';

/**
 * Branch — a physical/operational location of a Company (modeled on the
 * ERPNext `Branch` DocType). One company has many branches; an employee
 * belongs to one branch.
 */
@Entity('branches')
@Index('idx_branch_company', ['companyId'])
export class Branch extends Base {
  // ERPNext names this field `branch`
  @Column({ name: 'branch', type: 'varchar', length: 140 })
  branchName: string;

  // Link -> Company
  @Column({ name: 'company_id', type: 'varchar', length: 36, nullable: true, default: null })
  companyId: string | null;

  @ManyToOne(() => Company, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'company_id' })
  company?: Company | null;

  @Column({ name: 'address', type: 'text', nullable: true })
  address: string | null;
}
