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
  @IsPhoneNumber()
  phone: string;
  @IsEnum(['user', 'admin'], { message: 'Role Is not Valid!' })
  role: 'user' | 'admin';
}
