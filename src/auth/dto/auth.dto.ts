import {
  IsString,
  IsEmail,
  IsBoolean,
  IsOptional,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class LoginDto {
  @IsEmail()
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @IsString()
  password: string;
}

export class RegisterDto {
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  fullName: string;

  @IsEmail()
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @IsString()
  @IsOptional()
  @MaxLength(30)
  phoneNumber: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;

  @IsBoolean()
  isTcPpAccepted: boolean;

  @IsString()
  @IsOptional()
  @MaxLength(80)
  timezone: string;

  @IsString()
  @IsOptional()
  @MaxLength(120)
  companyName: string;
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
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;
}

export class ResetPasswordDto {
  @IsEmail()
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @IsString()
  otp: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  newPassword: string;
}

export class ChangePasswordDto {
  @IsString()
  oldPassword: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  newPassword: string;
}
