// src/user/dto/create-user.dto.ts
import {
  IsString,
  IsEmail,
  IsBoolean,
  IsOptional,
  IsEnum,
} from 'class-validator';


export class authDto {
  @IsEmail()
  email: string;
  @IsString()
  password: string;
}
