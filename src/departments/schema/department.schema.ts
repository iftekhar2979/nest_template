import { Column, Entity, Index } from 'typeorm';
import { Base } from '../../common/schema/base.schema';

/**
 * Department — modeled on the ERPNext HR `Department` DocType.
 * It is a nested-set tree (parent_department + lft/rgt/old_parent), scoped to a
 * company, with optional payroll/leave links. TS properties are camelCase but
 * map to ERPNext's snake_case column names and data types.
 */
@Entity('departments')
export class Department extends Base {
  // Data (reqd) — Frappe Data fields default to 140 chars
  @Index('idx_department_name')
  @Column({ name: 'department_name', type: 'varchar', length: 140 })
  departmentName: string;

  // Link -> Department (tree parent)
  @Column({
    name: 'parent_department',
    type: 'varchar',
    length: 36,
    nullable: true,
    default: null,
  })
  parentDepartment: string | null;

  // Check — is this a group (non-leaf) node in the tree
  @Column({ name: 'is_group', type: 'boolean', default: false })
  isGroup: boolean;

  // Check
  @Column({ name: 'disabled', type: 'boolean', default: false })
  disabled: boolean;

  // Link -> Leave Block List
  @Column({
    name: 'leave_block_list',
    type: 'varchar',
    length: 36,
    nullable: true,
    default: null,
  })
  leaveBlockList: string | null;

  // Link -> Cost Center
  @Column({
    name: 'payroll_cost_center',
    type: 'varchar',
    length: 36,
    nullable: true,
    default: null,
  })
  payrollCostCenter: string | null;

  // --- NestedSet bookkeeping (managed by the tree, not user input) ---

  @Column({ name: 'lft', type: 'int', nullable: true, default: null })
  lft: number | null;

  @Column({ name: 'rgt', type: 'int', nullable: true, default: null })
  rgt: number | null;

  @Column({
    name: 'old_parent',
    type: 'varchar',
    length: 36,
    nullable: true,
    default: null,
  })
  oldParent: string | null;
}
