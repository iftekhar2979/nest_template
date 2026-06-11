import { Column, Entity, Index } from 'typeorm';
import { Base } from '../../common/schema/base.schema';

/**
 * Company — modeled on the ERPNext `Company` DocType (lean subset).
 * One company owns many branches and many employees.
 */
@Entity('companies')
export class Company extends Base {
  @Index('idx_company_name', { unique: true })
  @Column({ name: 'company_name', type: 'varchar', length: 140, unique: true })
  companyName: string;

  // Short code, e.g. "ACME"
  @Column({ name: 'abbr', type: 'varchar', length: 10, nullable: true, default: null })
  abbr: string | null;

  @Column({
    name: 'default_currency',
    type: 'varchar',
    length: 3,
    nullable: true,
    default: null,
  })
  defaultCurrency: string | null;

  @Column({ name: 'country', type: 'varchar', nullable: true, default: null })
  country: string | null;

  @Column({ name: 'email', type: 'varchar', nullable: true, default: null })
  email: string | null;

  @Column({ name: 'phone_no', type: 'varchar', nullable: true, default: null })
  phoneNo: string | null;
}
