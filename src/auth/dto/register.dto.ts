import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength, IsBoolean, IsOptional, IsDateString, IsEnum } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '+1234567890' })
  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  @IsNotEmpty()
  isTcPpAccepted: boolean;

  @ApiProperty({ example: '1990-01-01' })
  @IsDateString()
  @IsOptional()
  dateOfBirth?: string;

  @ApiProperty({ example: 'male' })
  @IsString()
  @IsOptional()
  gender?: string;

  @ApiProperty({ example: 'Software Engineer' })
  @IsString()
  @IsOptional()
  employment?: string;

  @ApiProperty({ example: 'Bachelor' })
  @IsString()
  @IsOptional()
  education?: string;

  @ApiProperty({ example: 'MIT' })
  @IsString()
  @IsOptional()
  university?: string;

  @ApiProperty({ example: 'https://linkedin.com/in/johndoe' })
  @IsString()
  @IsOptional()
  linkedinUrl?: string;
}
