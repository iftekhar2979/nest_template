// src/user/dto/create-user.dto.ts
import {
  IsString,
  IsEmail,
  IsBoolean,
  IsOptional,
  IsEnum,
} from 'class-validator';
import mongoose from 'mongoose';

export class CreateUserDto {
  @IsString({})
  name: string;

  @IsString()
  password: string;

  @IsEmail()
  email: string;

  @IsString()
  phone: string;

  @IsEnum(['user', 'admin'], { message: 'Role Is not Valid!' })
  role: 'user' | 'admin';

  @IsOptional()
  profileID: mongoose.Schema.Types.ObjectId | null;
  @IsOptional()
  galleryID: mongoose.Schema.Types.ObjectId | null;

  @IsOptional()
  privacyPolicyAccepted: boolean;

  @IsOptional()
  isEmailVerified: boolean;

  @IsOptional()
  isVerifiedByAdmin: boolean;

  @IsOptional()
  isBlockedByAdmin: boolean;

  @IsOptional()
  isDeleted: boolean;
}
