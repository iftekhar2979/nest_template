import {
  IsJWT,
  IsNotEmpty,
  IsNumberString,
  IsString,
  IsEmail,
  IsBoolean,
  IsOptional,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class LoginDto {
  @IsEmail()
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  password: string;
}

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  fullName: string;

  @IsEmail()
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @IsString()
  @IsOptional()
  @MaxLength(30)
  @Transform(({ value }) => value?.trim())
  phoneNumber: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: 'Password must contain at least one letter and one number',
  })
  password: string;

  @IsBoolean()
  isTcPpAccepted: boolean;

  @IsString()
  @IsOptional()
  @MaxLength(80)
  @Transform(({ value }) => value?.trim())
  timezone: string;

  @IsString()
  @IsOptional()
  @MaxLength(120)
  @Transform(({ value }) => value?.trim())
  companyName: string;
}

export class VerifyOtpDto {
  @IsJWT()
  verificationToken: string;

  @IsString()
  @IsNumberString()
  @MinLength(6)
  @MaxLength(6)
  code: string;
}

export class RefreshTokenDto {
  @IsJWT()
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
  @IsNumberString()
  @MinLength(6)
  @MaxLength(6)
  otp: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: 'Password must contain at least one letter and one number',
  })
  newPassword: string;
}

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  oldPassword: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: 'Password must contain at least one letter and one number',
  })
  newPassword: string;
}
