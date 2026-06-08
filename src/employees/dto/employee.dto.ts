import { PartialType } from '@nestjs/swagger';
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
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  fullName?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  firstName?: string;

  @IsOptional()
  @IsString()
  middleName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  // --- Employment ---
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  employeeCode: string;

  @IsOptional()
  @IsString()
  namingSeries?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  employeeNumber?: string;

  @IsOptional()
  @IsEnum(EmployeeStatus)
  employeeStatus?: EmployeeStatus;

  @IsOptional()
  @IsUUID()
  companyId?: string;

  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @IsOptional()
  @IsUUID()
  designationId?: string;

  @IsOptional()
  @IsUUID()
  reportsToEmployeeId?: string;

  @IsOptional()
  @IsUUID()
  branchId?: string;

  @IsOptional()
  @IsUUID()
  gradeId?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsEnum(EmploymentType)
  employmentType?: EmploymentType;

  @IsOptional()
  @IsDateString()
  joiningDate?: string;

  @IsOptional()
  @IsDateString()
  offerDate?: string;

  @IsOptional()
  @IsDateString()
  confirmationDate?: string;

  @IsOptional()
  @IsDateString()
  contractEndDate?: string;

  @IsOptional()
  @IsInt()
  noticeNumberOfDays?: number;

  @IsOptional()
  @IsDateString()
  dateOfRetirement?: string;

  @IsOptional()
  @IsUUID()
  defaultShiftId?: string;

  @IsOptional()
  @IsString()
  holidayListId?: string;

  @IsOptional()
  @IsString()
  attendanceDeviceId?: string;

  @IsOptional()
  @IsEmail()
  companyEmail?: string;

  @IsOptional()
  @IsEmail()
  personalEmail?: string;

  @IsOptional()
  @IsString()
  preferredContactEmail?: string;
}

// employment fields only (identity is managed via the users module)
class EmployeeEmploymentDto {
  @IsOptional()
  @IsString()
  namingSeries?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  employeeNumber?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  firstName?: string;

  @IsOptional()
  @IsString()
  middleName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsEnum(EmployeeStatus)
  employeeStatus?: EmployeeStatus;

  @IsOptional()
  @IsUUID()
  companyId?: string;

  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @IsOptional()
  @IsUUID()
  designationId?: string;

  @IsOptional()
  @IsUUID()
  reportsToEmployeeId?: string;

  @IsOptional()
  @IsUUID()
  branchId?: string;

  @IsOptional()
  @IsUUID()
  gradeId?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsEnum(EmploymentType)
  employmentType?: EmploymentType;

  @IsOptional()
  @IsDateString()
  joiningDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  employeeCode?: string;

  @IsOptional()
  @IsDateString()
  offerDate?: string;

  @IsOptional()
  @IsDateString()
  confirmationDate?: string;

  @IsOptional()
  @IsDateString()
  contractEndDate?: string;

  @IsOptional()
  @IsInt()
  noticeNumberOfDays?: number;

  @IsOptional()
  @IsDateString()
  dateOfRetirement?: string;

  @IsOptional()
  @IsUUID()
  defaultShiftId?: string;

  @IsOptional()
  @IsString()
  holidayListId?: string;

  @IsOptional()
  @IsString()
  attendanceDeviceId?: string;

  @IsOptional()
  @IsString()
  cellNumber?: string;

  @IsOptional()
  @IsEmail()
  companyEmail?: string;

  @IsOptional()
  @IsEmail()
  personalEmail?: string;

  @IsOptional()
  @IsString()
  preferredContactEmail?: string;

  @IsOptional()
  @IsEmail()
  preferredEmail?: string;

  @IsOptional()
  @IsBoolean()
  unsubscribed?: boolean;

  @IsOptional()
  @IsString()
  currentAddress?: string;

  @IsOptional()
  @IsEnum(AccommodationType)
  currentAccommodationType?: AccommodationType;

  @IsOptional()
  @IsString()
  permanentAddress?: string;

  @IsOptional()
  @IsEnum(AccommodationType)
  permanentAccommodationType?: AccommodationType;

  @IsOptional()
  @IsString()
  emergencyContactName?: string;

  @IsOptional()
  @IsString()
  emergencyPhoneNumber?: string;

  @IsOptional()
  @IsString()
  emergencyContactRelation?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsEnum(SalaryMode)
  salaryMode?: SalaryMode;

  @IsOptional()
  @IsString()
  salaryCurrency?: string;

  @IsOptional()
  @IsNumberString()
  ctc?: string;

  @IsOptional()
  @IsString()
  bankName?: string;

  @IsOptional()
  @IsString()
  bankAccountNo?: string;

  @IsOptional()
  @IsString()
  iban?: string;

  @IsOptional()
  @IsEnum(MaritalStatus)
  maritalStatus?: MaritalStatus;

  @IsOptional()
  @IsEnum(BloodGroup)
  bloodGroup?: BloodGroup;

  @IsOptional()
  @IsString()
  familyBackground?: string;

  @IsOptional()
  @IsString()
  healthDetails?: string;

  @IsOptional()
  @IsString()
  passportNumber?: string;

  @IsOptional()
  @IsDateString()
  passportValidUpto?: string;

  @IsOptional()
  @IsDateString()
  passportDateOfIssue?: string;

  @IsOptional()
  @IsString()
  passportPlaceOfIssue?: string;

  @IsOptional()
  @IsDateString()
  resignationLetterDate?: string;

  @IsOptional()
  @IsDateString()
  relievingDate?: string;

  @IsOptional()
  @IsDateString()
  exitInterviewHeldOn?: string;

  @IsOptional()
  @IsString()
  newWorkplace?: string;

  @IsOptional()
  @IsBoolean()
  leaveEncashed?: boolean;

  @IsOptional()
  @IsDateString()
  encashmentDate?: string;

  @IsOptional()
  @IsString()
  reasonForLeaving?: string;

  @IsOptional()
  @IsString()
  exitFeedback?: string;
}

export class UpdateEmployeeDto extends PartialType(EmployeeEmploymentDto) {}

export class BiometricEnrollDto {
  @IsEnum(BiometricModality)
  biometricModality: BiometricModality;

  @IsString()
  biometricTemplateRef: string;

  @IsOptional()
  @IsString()
  biometricDeviceVendor?: string;
}
