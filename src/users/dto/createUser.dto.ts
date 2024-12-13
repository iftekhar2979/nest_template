// import { IsDate } from 'class-validator';
// src/user/dto/create-user.dto.ts
import {
  IsString,
  IsEmail,
  IsBoolean,
  IsOptional,
  IsEnum,
  isString,
  IsDate,
  IsDateString,
  IsPhoneNumber,
  ValidateIf,
} from 'class-validator';
import mongoose from 'mongoose';

export class CreateUserDto {
  @IsString({})
  name: string;

  @IsString()
  password: string;

  @IsEmail()
  email: string;

  @ValidateIf((o) => !!o.phone)  // Only apply if phone exists
  @IsPhoneNumber('US', { message: 'Please provide a valid US phone number' })
  @IsPhoneNumber('CA', { message: 'Please provide a valid Canadian phone number' })
  @IsPhoneNumber('GB', { message: 'Please provide a valid UK phone number' })
  @IsPhoneNumber('IN', { message: 'Please provide a valid Indian phone number' })
  @IsPhoneNumber('AU', { message: 'Please provide a valid Australian phone number' })
  @IsPhoneNumber('BD', { message: 'Please provide a valid Bangladeshi phone number' })
  phone: string;

  @IsEnum(['user', 'admin'], { message: 'Role Is not Valid!' })
  role: 'user' | 'admin';
  @IsEnum(['male', 'female'], { message: 'Gender must be male of female' })
  gender: string;
  @IsString()
  dOB: Date;
  @IsString()
  height: string;
  @IsOptional()
  @IsEnum(['google', 'facebook', 'custom'])
  userCreatedMethod: string;
}
