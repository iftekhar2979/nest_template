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
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsEmail()
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @ApiProperty({
    description: 'User password',
    example: 'Password123!',
    maxLength: 128,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  password: string;
}

export class RegisterDto {
  @ApiProperty({
    description: 'Full name of the user',
    example: 'John Doe',
    minLength: 3,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  fullName: string;

  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @ApiProperty({
    description: 'User phone number (optional)',
    example: '+1234567890',
    required: false,
    maxLength: 30,
  })
  @IsString()
  @IsOptional()
  @MaxLength(30)
  @Transform(({ value }) => value?.trim())
  phoneNumber: string;

  @ApiProperty({
    description: 'User password (must contain at least one letter and one number)',
    example: 'StrongPassword123',
    minLength: 8,
    maxLength: 128,
  })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: 'Password must contain at least one letter and one number',
  })
  password: string;

  @ApiProperty({
    description: 'Terms and Conditions and Privacy Policy acceptance status',
    example: true,
  })
  @IsBoolean()
  isTcPpAccepted: boolean;

  @ApiProperty({
    description: 'User timezone (optional)',
    example: 'Asia/Dhaka',
    required: false,
    maxLength: 80,
  })
  @IsString()
  @IsOptional()
  @MaxLength(80)
  @Transform(({ value }) => value?.trim())
  timezone: string;

  @ApiProperty({
    description: 'Company name (optional)',
    example: 'Ilmify Tech',
    required: false,
    maxLength: 120,
  })
  @IsString()
  @IsOptional()
  @MaxLength(120)
  @Transform(({ value }) => value?.trim())
  companyName: string;
}

export class VerifyOtpDto {
  @ApiProperty({
    description: 'JWT verification token received after registration',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsJWT()
  verificationToken: string;

  @ApiProperty({
    description: '6-digit OTP code',
    example: '123456',
    minLength: 6,
    maxLength: 6,
  })
  @IsString()
  @IsNumberString()
  @MinLength(6)
  @MaxLength(6)
  code: string;
}

export class RefreshTokenDto {
  @ApiProperty({
    description: 'Valid JWT refresh token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsJWT()
  refreshToken: string;
}

export class ForgotPasswordDto {
  @ApiProperty({
    description: 'User email address to receive reset link/OTP',
    example: 'user@example.com',
  })
  @IsEmail()
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({
    description: 'JWT reset token received in email',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsJWT()
  resetToken: string;

  @ApiProperty({
    description: 'New password (must contain at least one letter and one number)',
    example: 'NewStrongPassword123',
    minLength: 8,
    maxLength: 128,
  })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: 'Password must contain at least one letter and one number',
  })
  newPassword: string;
}

export class ChangePasswordDto {
  @ApiProperty({
    description: 'Current password',
    example: 'OldPassword123!',
  })
  @IsString()
  @IsNotEmpty()
  oldPassword: string;

  @ApiProperty({
    description: 'New password (must contain at least one letter and one number)',
    example: 'NewStrongPassword123',
    minLength: 8,
    maxLength: 128,
  })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: 'Password must contain at least one letter and one number',
  })
  newPassword: string;
}
