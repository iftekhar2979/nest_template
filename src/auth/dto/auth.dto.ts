import {
  IsString,
  IsEmail,
  IsBoolean,
  IsOptional,
  IsEnum,
  MinLength,
  IsDateString,
  IsUrl,
} from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

export class RegisterDto {
  @IsString()
  @MinLength(3)
  fullName: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  phoneNumber: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsBoolean()
  isTcPpAccepted: boolean;

  @IsDateString()
  @IsOptional()
  dateOfBirth: string;

  @IsString()
  @IsOptional()
  gender: string;

  @IsString()
  @IsOptional()
  employment: string;

  @IsString()
  @IsOptional()
  education: string;

  @IsString()
  @IsOptional()
  university: string;

  @IsUrl()
  @IsOptional()
  linkedinUrl: string;
}

export class VerifyOtpDto {
  @IsString()
  @MinLength(6)
  code: string;
}

export class RefreshTokenDto {
  @IsString()
  refreshToken: string;
}

export class ForgotPasswordDto {
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @IsEmail()
  email: string;

  @IsString()
  otp: string;

  @IsString()
  @MinLength(6)
  newPassword: string;
}

export class ChangePasswordDto {
  @IsString()
  oldPassword: string;

  @IsString()
  @MinLength(6)
  newPassword: string;
}
