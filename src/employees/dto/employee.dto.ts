import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsNumberString,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  AccommodationType,
  BiometricModality,
  BloodGroup,
  EmployeeStatus,
  EmploymentType,
  MaritalStatus,
  SalaryMode,
} from '../schema/employee.schema';

export class EnrollEmployeeDto {
  // --- Login / personal ---
  @ApiProperty({ description: 'Login email address', example: 'jane.doe@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Full name', example: 'Jane Doe', required: false })
  @IsOptional()
  @IsString()
  @MinLength(2)
  fullName?: string;

  @ApiProperty({ description: 'First name', example: 'Jane', required: false })
  @IsOptional()
  @IsString()
  @MinLength(1)
  firstName?: string;

  @ApiProperty({ description: 'Middle name', example: 'Anne', required: false })
  @IsOptional()
  @IsString()
  middleName?: string;

  @ApiProperty({ description: 'Last name', example: 'Doe', required: false })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ description: 'Gender', example: 'Female', required: false })
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiProperty({ description: 'Date of birth', example: '1990-01-01', required: false })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiProperty({ description: 'Login password', example: 'StrongPass123!', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ description: 'Phone number', example: '+1234567890', required: false })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  // --- Employment ---
  @ApiProperty({ description: 'Unique employee code', example: 'EMP-001' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  employeeCode: string;

  @ApiProperty({ description: 'Naming series for ID generation', example: 'HR-EMP-', required: false })
  @IsOptional()
  @IsString()
  namingSeries?: string;

  @ApiProperty({ description: 'Alternative employee number', example: '001', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  employeeNumber?: string;

  @ApiProperty({ description: 'Employee status', enum: EmployeeStatus, required: false })
  @IsOptional()
  @IsEnum(EmployeeStatus)
  employeeStatus?: EmployeeStatus;

  @ApiProperty({ description: 'Company UUID', example: '550e8400-e29b-41d4-a716-446655440001', required: false })
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @ApiProperty({ description: 'Department UUID', example: '550e8400-e29b-41d4-a716-446655440002', required: false })
  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @ApiProperty({ description: 'Designation UUID', example: '550e8400-e29b-41d4-a716-446655440003', required: false })
  @IsOptional()
  @IsUUID()
  designationId?: string;

  @ApiProperty({ description: 'Reporting manager employee UUID', example: '550e8400-e29b-41d4-a716-446655440004', required: false })
  @IsOptional()
  @IsUUID()
  reportsToEmployeeId?: string;

  @ApiProperty({ description: 'Branch UUID', example: '550e8400-e29b-41d4-a716-446655440005', required: false })
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiProperty({ description: 'Grade UUID', example: '550e8400-e29b-41d4-a716-446655440006', required: false })
  @IsOptional()
  @IsUUID()
  gradeId?: string;

  @ApiProperty({ description: 'Work location', example: 'New York Office', required: false })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({ description: 'Employment type', enum: EmploymentType, required: false })
  @IsOptional()
  @IsEnum(EmploymentType)
  employmentType?: EmploymentType;

  @ApiProperty({ description: 'Joining date', example: '2024-06-01', required: false })
  @IsOptional()
  @IsDateString()
  joiningDate?: string;

  @ApiProperty({ description: 'Offer date', example: '2024-05-15', required: false })
  @IsOptional()
  @IsDateString()
  offerDate?: string;

  @ApiProperty({ description: 'Confirmation date', example: '2024-09-01', required: false })
  @IsOptional()
  @IsDateString()
  confirmationDate?: string;

  @ApiProperty({ description: 'Contract end date', example: '2025-06-01', required: false })
  @IsOptional()
  @IsDateString()
  contractEndDate?: string;

  @ApiProperty({ description: 'Notice period in days', example: 30, required: false })
  @IsOptional()
  @IsInt()
  noticeNumberOfDays?: number;

  @ApiProperty({ description: 'Date of retirement', example: '2055-01-01', required: false })
  @IsOptional()
  @IsDateString()
  dateOfRetirement?: string;

  @ApiProperty({ description: 'Default shift UUID', example: '550e8400-e29b-41d4-a716-446655440007', required: false })
  @IsOptional()
  @IsUUID()
  defaultShiftId?: string;

  @ApiProperty({ description: 'Holiday list ID', example: 'HL-2024', required: false })
  @IsOptional()
  @IsString()
  holidayListId?: string;

  @ApiProperty({ description: 'Attendance device enrollment ID', example: 'DEV-123', required: false })
  @IsOptional()
  @IsString()
  attendanceDeviceId?: string;

  @ApiProperty({ description: 'Official company email', example: 'jane.doe@company.com', required: false })
  @IsOptional()
  @IsEmail()
  companyEmail?: string;

  @ApiProperty({ description: 'Personal email', example: 'jane.personal@gmail.com', required: false })
  @IsOptional()
  @IsEmail()
  personalEmail?: string;

  @ApiProperty({ description: 'Preferred contact email', example: 'jane.doe@company.com', required: false })
  @IsOptional()
  @IsString()
  preferredContactEmail?: string;
}

// employment fields only (identity is managed via the users module)
class EmployeeEmploymentDto {
  @ApiProperty({ description: 'Naming series', required: false })
  @IsOptional()
  @IsString()
  namingSeries?: string;

  @ApiProperty({ description: 'Employee number', maxLength: 50, required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  employeeNumber?: string;

  @ApiProperty({ description: 'First name', required: false })
  @IsOptional()
  @IsString()
  @MinLength(1)
  firstName?: string;

  @ApiProperty({ description: 'Middle name', required: false })
  @IsOptional()
  @IsString()
  middleName?: string;

  @ApiProperty({ description: 'Last name', required: false })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ description: 'Gender', required: false })
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiProperty({ description: 'Date of birth', required: false })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiProperty({ description: 'Employee status', enum: EmployeeStatus, required: false })
  @IsOptional()
  @IsEnum(EmployeeStatus)
  employeeStatus?: EmployeeStatus;

  @ApiProperty({ description: 'Company UUID', required: false })
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @ApiProperty({ description: 'Department UUID', required: false })
  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @ApiProperty({ description: 'Designation UUID', required: false })
  @IsOptional()
  @IsUUID()
  designationId?: string;

  @ApiProperty({ description: 'Reports to employee UUID', required: false })
  @IsOptional()
  @IsUUID()
  reportsToEmployeeId?: string;

  @ApiProperty({ description: 'Branch UUID', required: false })
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiProperty({ description: 'Grade UUID', required: false })
  @IsOptional()
  @IsUUID()
  gradeId?: string;

  @ApiProperty({ description: 'Location', required: false })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({ description: 'Employment type', enum: EmploymentType, required: false })
  @IsOptional()
  @IsEnum(EmploymentType)
  employmentType?: EmploymentType;

  @ApiProperty({ description: 'Joining date', required: false })
  @IsOptional()
  @IsDateString()
  joiningDate?: string;

  @ApiProperty({ description: 'Employee code', maxLength: 50, required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  employeeCode?: string;

  @ApiProperty({ description: 'Offer date', required: false })
  @IsOptional()
  @IsDateString()
  offerDate?: string;

  @ApiProperty({ description: 'Confirmation date', required: false })
  @IsOptional()
  @IsDateString()
  confirmationDate?: string;

  @ApiProperty({ description: 'Contract end date', required: false })
  @IsOptional()
  @IsDateString()
  contractEndDate?: string;

  @ApiProperty({ description: 'Notice period days', required: false })
  @IsOptional()
  @IsInt()
  noticeNumberOfDays?: number;

  @ApiProperty({ description: 'Retirement date', required: false })
  @IsOptional()
  @IsDateString()
  dateOfRetirement?: string;

  @ApiProperty({ description: 'Default shift UUID', required: false })
  @IsOptional()
  @IsUUID()
  defaultShiftId?: string;

  @ApiProperty({ description: 'Holiday list ID', required: false })
  @IsOptional()
  @IsString()
  holidayListId?: string;

  @ApiProperty({ description: 'Attendance device ID', required: false })
  @IsOptional()
  @IsString()
  attendanceDeviceId?: string;

  @ApiProperty({ description: 'Cell phone number', required: false })
  @IsOptional()
  @IsString()
  cellNumber?: string;

  @ApiProperty({ description: 'Company email', required: false })
  @IsOptional()
  @IsEmail()
  companyEmail?: string;

  @ApiProperty({ description: 'Personal email', required: false })
  @IsOptional()
  @IsEmail()
  personalEmail?: string;

  @ApiProperty({ description: 'Preferred contact email', required: false })
  @IsOptional()
  @IsString()
  preferredContactEmail?: string;

  @ApiProperty({ description: 'Preferred email', required: false })
  @IsOptional()
  @IsEmail()
  preferredEmail?: string;

  @ApiProperty({ description: 'Unsubscribed from notifications', required: false })
  @IsOptional()
  @IsBoolean()
  unsubscribed?: boolean;

  @ApiProperty({ description: 'Current address', required: false })
  @IsOptional()
  @IsString()
  currentAddress?: string;

  @ApiProperty({ description: 'Current accommodation type', enum: AccommodationType, required: false })
  @IsOptional()
  @IsEnum(AccommodationType)
  currentAccommodationType?: AccommodationType;

  @ApiProperty({ description: 'Permanent address', required: false })
  @IsOptional()
  @IsString()
  permanentAddress?: string;

  @ApiProperty({ description: 'Permanent accommodation type', enum: AccommodationType, required: false })
  @IsOptional()
  @IsEnum(AccommodationType)
  permanentAccommodationType?: AccommodationType;

  @ApiProperty({ description: 'Emergency contact name', required: false })
  @IsOptional()
  @IsString()
  emergencyContactName?: string;

  @ApiProperty({ description: 'Emergency phone number', required: false })
  @IsOptional()
  @IsString()
  emergencyPhoneNumber?: string;

  @ApiProperty({ description: 'Emergency contact relation', required: false })
  @IsOptional()
  @IsString()
  emergencyContactRelation?: string;

  @ApiProperty({ description: 'Employee bio', required: false })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiProperty({ description: 'Salary payment mode', enum: SalaryMode, required: false })
  @IsOptional()
  @IsEnum(SalaryMode)
  salaryMode?: SalaryMode;

  @ApiProperty({ description: 'Salary currency', example: 'USD', required: false })
  @IsOptional()
  @IsString()
  salaryCurrency?: string;

  @ApiProperty({ description: 'Cost to Company (CTC)', example: '50000.00', required: false })
  @IsOptional()
  @IsNumberString()
  ctc?: string;

  @ApiProperty({ description: 'Bank name', required: false })
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiProperty({ description: 'Bank account number', required: false })
  @IsOptional()
  @IsString()
  bankAccountNo?: string;

  @ApiProperty({ description: 'IBAN', required: false })
  @IsOptional()
  @IsString()
  iban?: string;

  @ApiProperty({ description: 'Marital status', enum: MaritalStatus, required: false })
  @IsOptional()
  @IsEnum(MaritalStatus)
  maritalStatus?: MaritalStatus;

  @ApiProperty({ description: 'Blood group', enum: BloodGroup, required: false })
  @IsOptional()
  @IsEnum(BloodGroup)
  bloodGroup?: BloodGroup;

  @ApiProperty({ description: 'Family background details', required: false })
  @IsOptional()
  @IsString()
  familyBackground?: string;

  @ApiProperty({ description: 'Health details', required: false })
  @IsOptional()
  @IsString()
  healthDetails?: string;

  @ApiProperty({ description: 'Passport number', required: false })
  @IsOptional()
  @IsString()
  passportNumber?: string;

  @ApiProperty({ description: 'Passport expiry date', required: false })
  @IsOptional()
  @IsDateString()
  passportValidUpto?: string;

  @ApiProperty({ description: 'Passport issue date', required: false })
  @IsOptional()
  @IsDateString()
  passportDateOfIssue?: string;

  @ApiProperty({ description: 'Passport place of issue', required: false })
  @IsOptional()
  @IsString()
  passportPlaceOfIssue?: string;

  @ApiProperty({ description: 'Resignation letter date', required: false })
  @IsOptional()
  @IsDateString()
  resignationLetterDate?: string;

  @ApiProperty({ description: 'Relieving date', required: false })
  @IsOptional()
  @IsDateString()
  relievingDate?: string;

  @ApiProperty({ description: 'Exit interview date', required: false })
  @IsOptional()
  @IsDateString()
  exitInterviewHeldOn?: string;

  @ApiProperty({ description: 'New workplace', required: false })
  @IsOptional()
  @IsString()
  newWorkplace?: string;

  @ApiProperty({ description: 'Was leave encashed?', required: false })
  @IsOptional()
  @IsBoolean()
  leaveEncashed?: boolean;

  @ApiProperty({ description: 'Encashment date', required: false })
  @IsOptional()
  @IsDateString()
  encashmentDate?: string;

  @ApiProperty({ description: 'Reason for leaving', required: false })
  @IsOptional()
  @IsString()
  reasonForLeaving?: string;

  @ApiProperty({ description: 'Exit feedback', required: false })
  @IsOptional()
  @IsString()
  exitFeedback?: string;
}

export class UpdateEmployeeDto extends PartialType(EmployeeEmploymentDto) {}

export class BiometricEnrollDto {
  @ApiProperty({ description: 'Biometric modality', enum: BiometricModality })
  @IsEnum(BiometricModality)
  biometricModality: BiometricModality;

  @ApiProperty({ description: 'Opaque biometric template reference', example: 'REF-XXXX-YYYY' })
  @IsString()
  biometricTemplateRef: string;

  @ApiProperty({ description: 'Biometric device vendor name', example: 'ZKTeco', required: false })
  @IsOptional()
  @IsString()
  biometricDeviceVendor?: string;
}

export class EmployeeResponseDto extends EnrollEmployeeDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440005' })
  id: string;

  @ApiProperty({ description: 'Linked user UUID', example: '550e8400-e29b-41d4-a716-446655440000' })
  userId: string;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: 'active' })
  status: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  updatedAt: Date;

  @ApiProperty({ description: 'Employee name', example: 'Jane Doe' })
  employeeName: string;

  @ApiProperty({ description: 'Biometric enrollment date', example: '2024-01-01T00:00:00.000Z', required: false, nullable: true })
  biometricEnrolledAt?: Date | null;
}

export class EmployeeDeleteResponseDto {
  @ApiProperty({ example: 'Employee deleted successfully' })
  message: string;
}
