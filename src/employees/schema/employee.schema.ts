import { Column, Entity, Index, JoinColumn, ManyToOne, OneToOne } from 'typeorm';
import { Base } from '../../common/schema/base.schema';
import { Company } from '../../company/schema/company.schema';
import { Branch } from '../../branch/schema/branch.schema';
import { Shift } from '../../shifts/schema/shift.schema';
import { Department } from '../../departments/schema/department.schema';
import { Designation } from '../../designations/schema/designation.schema';
import { WorkWeekPattern } from '../../workweeks/schema/work-week-pattern.schema';
import { User } from '../../users/schema/users.schema';

export enum EmploymentType {
  PROBATION = 'probation',
  FULL_TIME = 'full_time',
  PART_TIME = 'part_time',
  CONTRACT = 'contract',
  INTERN = 'intern',
  TEMPORARY = 'temporary',
}

export enum EmployeeStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  LEFT = 'left',
}

export enum SalaryMode {
  BANK = 'bank',
  CASH = 'cash',
  CHEQUE = 'cheque',
}

export enum AccommodationType {
  RENTED = 'rented',
  OWNED = 'owned',
}

export enum MaritalStatus {
  SINGLE = 'single',
  MARRIED = 'married',
  DIVORCED = 'divorced',
  WIDOWED = 'widowed',
}

export enum BloodGroup {
  A_POSITIVE = 'A+',
  A_NEGATIVE = 'A-',
  B_POSITIVE = 'B+',
  B_NEGATIVE = 'B-',
  AB_POSITIVE = 'AB+',
  AB_NEGATIVE = 'AB-',
  O_POSITIVE = 'O+',
  O_NEGATIVE = 'O-',
}

export enum BiometricModality {
  FINGERPRINT = 'fingerprint',
  FACE = 'face',
  IRIS = 'iris',
}

/**
 * Employment record for a person. 1:1 with a User (the login identity).
 * Attendance, shifts, leave, etc. are keyed on the linked userId.
 */
@Entity('employees')
@Index('idx_employee_company', ['companyId'])
@Index('idx_employee_department', ['departmentId'])
@Index('idx_employee_designation', ['designationId'])
@Index('idx_employee_branch', ['branchId'])
@Index('idx_employee_reports_to', ['reportsToEmployeeId'])
export class Employee extends Base {
  // Link to the User login (1:1)
  @OneToOne(() => User, (user) => user.employee)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Index('idx_employee_user', { unique: true })
  @Column({ type: 'varchar', length: 36, unique: true })
  userId: string;

  @Index('idx_employee_code', { unique: true })
  @Column({ type: 'varchar', length: 50, unique: true })
  employeeCode: string;

  @Column({ type: 'varchar', nullable: true, default: null })
  namingSeries: string;

  @Column({ type: 'varchar', length: 50, nullable: true, default: null })
  employeeNumber: string;

  @Column({ type: 'varchar' })
  firstName: string;

  @Column({ type: 'varchar', nullable: true, default: null })
  middleName: string;

  @Column({ type: 'varchar', nullable: true, default: null })
  lastName: string;

  @Column({ type: 'varchar' })
  employeeName: string;

  @Column({ type: 'varchar', nullable: true, default: null })
  gender: string;

  @Column({ type: 'date', nullable: true, default: null })
  dateOfBirth: string;

  @Column({
    type: 'enum',
    enum: EmployeeStatus,
    default: EmployeeStatus.ACTIVE,
  })
  employeeStatus: EmployeeStatus;

  @Column({ type: 'varchar', length: 36, nullable: true, default: null })
  companyId: string;

  // Joinable relation backed by companyId (employees:company = many:one)
  @ManyToOne(() => Company, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'companyId' })
  company?: Company | null;

  @Column({ type: 'varchar', length: 36, nullable: true, default: null })
  departmentId: string;

  // Joinable relation backed by departmentId (employees:department = many:one)
  @ManyToOne(() => Department, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'departmentId' })
  department?: Department | null;

  @Column({ type: 'varchar', length: 36, nullable: true, default: null })
  designationId: string;

  // Joinable relation backed by designationId (employees:designation = many:one)
  @ManyToOne(() => Designation, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'designationId' })
  designation?: Designation | null;

  @Column({ type: 'varchar', length: 36, nullable: true, default: null })
  reportsToEmployeeId: string;

  @Column({ type: 'varchar', length: 36, nullable: true, default: null })
  branchId: string;

  // Joinable relation backed by branchId (employees:branch = many:one)
  @ManyToOne(() => Branch, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'branchId' })
  branch?: Branch | null;

  @Column({ type: 'varchar', length: 36, nullable: true, default: null })
  gradeId: string;

  @Column({ type: 'varchar', nullable: true })
  location: string;

  @Column({
    type: 'enum',
    enum: EmploymentType,
    nullable: true,
    default: null,
  })
  employmentType: EmploymentType;

  @Column({ type: 'date', nullable: true, default: null })
  joiningDate: string;

  @Column({ type: 'date', nullable: true, default: null })
  offerDate: string;

  @Column({ type: 'date', nullable: true, default: null })
  confirmationDate: string;

  @Column({ type: 'date', nullable: true, default: null })
  contractEndDate: string;

  @Column({ type: 'int', nullable: true, default: null })
  noticeNumberOfDays: number;

  @Column({ type: 'date', nullable: true, default: null })
  dateOfRetirement: string;

  @Column({ type: 'varchar', length: 36, nullable: true, default: null })
  defaultShiftId: string;

  // Joinable relation backed by defaultShiftId. This is only the *fallback*
  // shift; rotating/temporary shifts are modelled per-date in ShiftAssignment
  // and resolved via ShiftsService.resolveShiftForUser().
  @ManyToOne(() => Shift, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'defaultShiftId' })
  defaultShift?: Shift | null;

  @Column({ type: 'varchar', nullable: true, default: null })
  holidayListId: string;

  @Index('idx_employee_attendance_device_id', { unique: true })
  @Column({ type: 'varchar', nullable: true, unique: true, default: null })
  attendanceDeviceId: string;

  @Column({ type: 'varchar', nullable: true, default: null })
  cellNumber: string;

  @Column({ type: 'varchar', nullable: true, default: null })
  companyEmail: string;

  @Column({ type: 'varchar', nullable: true, default: null })
  personalEmail: string;

  @Column({ type: 'varchar', nullable: true, default: null })
  preferredContactEmail: string;

  @Column({ type: 'varchar', nullable: true, default: null })
  preferredEmail: string;

  @Column({ type: 'boolean', default: false })
  unsubscribed: boolean;

  @Column({ type: 'text', nullable: true })
  currentAddress: string;

  @Column({
    type: 'enum',
    enum: AccommodationType,
    nullable: true,
    default: null,
  })
  currentAccommodationType: AccommodationType;

  @Column({ type: 'text', nullable: true })
  permanentAddress: string;

  @Column({
    type: 'enum',
    enum: AccommodationType,
    nullable: true,
    default: null,
  })
  permanentAccommodationType: AccommodationType;

  @Column({ type: 'varchar', nullable: true, default: null })
  emergencyContactName: string;

  @Column({ type: 'varchar', nullable: true, default: null })
  emergencyPhoneNumber: string;

  @Column({ type: 'varchar', nullable: true, default: null })
  emergencyContactRelation: string;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({
    type: 'enum',
    enum: SalaryMode,
    nullable: true,
    default: null,
  })
  salaryMode: SalaryMode;

  @Column({ type: 'varchar', nullable: true, default: null })
  salaryCurrency: string;

  @Column({ type: 'decimal', precision: 14, scale: 2, nullable: true })
  ctc: string;

  @Column({ type: 'varchar', nullable: true, default: null })
  bankName: string;

  @Column({ type: 'varchar', nullable: true, default: null })
  bankAccountNo: string;

  @Column({ type: 'varchar', nullable: true, default: null })
  iban: string;

  @Column({
    type: 'enum',
    enum: MaritalStatus,
    nullable: true,
    default: null,
  })
  maritalStatus: MaritalStatus;

  @Column({
    type: 'enum',
    enum: BloodGroup,
    nullable: true,
    default: null,
  })
  bloodGroup: BloodGroup;

  @Column({ type: 'text', nullable: true })
  familyBackground: string;

  @Column({ type: 'text', nullable: true })
  healthDetails: string;

  @Column({ type: 'varchar', nullable: true, default: null })
  passportNumber: string;

  @Column({ type: 'date', nullable: true, default: null })
  passportValidUpto: string;

  @Column({ type: 'date', nullable: true, default: null })
  passportDateOfIssue: string;

  @Column({ type: 'varchar', nullable: true, default: null })
  passportPlaceOfIssue: string;

  @Column({ type: 'date', nullable: true, default: null })
  resignationLetterDate: string;

  @Column({ type: 'date', nullable: true, default: null })
  relievingDate: string;

  @Column({ type: 'date', nullable: true, default: null })
  exitInterviewHeldOn: string;

  @Column({ type: 'varchar', nullable: true, default: null })
  newWorkplace: string;

  @Column({ type: 'boolean', default: false })
  leaveEncashed: boolean;

  @Column({ type: 'date', nullable: true, default: null })
  encashmentDate: string;

  @Column({ type: 'text', nullable: true })
  reasonForLeaving: string;

  @Column({ type: 'text', nullable: true })
  exitFeedback: string;

  // --- Biometric template reference (no raw templates stored) ---

  @Column({
    type: 'enum',
    enum: BiometricModality,
    nullable: true,
    default: null,
  })
  biometricModality: BiometricModality;

  // Opaque reference the device/SDK uses to match (not the template itself)
  @Column({ type: 'varchar', nullable: true, default: null })
  biometricTemplateRef: string;

  @Column({ type: 'varchar', nullable: true, default: null })
  biometricDeviceVendor: string;

  @Column({ type: 'datetime', nullable: true, default: null })
  biometricEnrolledAt: Date;

  // Transient: currently-active work-week pattern (resolved per request, not persisted)
  workWeekPattern?: WorkWeekPattern | null;
}
