import {
  IsString,
  IsEmail,
  Length,
  IsEnum,
  IsDateString,
  IsNumberString,
  IsNumber,
  Min,
  Max,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RoleType } from '../schema/users.schema';

export enum WeightType {
  KG = 'kg',
  G = 'g',
  LB = 'lb',
}

export enum HeightType {
  CM = 'cm',
  FT = 'ft',
  MM = 'mm',
  M = 'm',
  INCH = 'in',
}

export enum CaloryType {
  CAL = 'cal',
  KCAL = 'kcal',
}
export enum GenderType {
  MALE = 'male',
  FEMALE = 'female',
}

export class ProfileDto {
  @ApiProperty({ example: '1990-01-01', description: 'Date of Birth' })
  @IsDateString()
  dOB: string;

  @ApiProperty({ example: '180', description: 'Height' })
  @IsString()
  @Length(1, 10)
  height: string;

  @ApiProperty({ example: '75', description: 'Weight' })
  @IsNumberString()
  @Length(1, 10)
  weight: string;

  @ApiProperty({ example: 70, description: 'Weight Goal' })
  @IsNumber()
  weightGoal: number;

  @ApiProperty({ example: 2000, description: 'Calory Goal' })
  @IsNumber()
  @Min(1)
  @Max(9999)
  caloryGoal: number;

  @ApiProperty({ example: 150, description: 'Protein Goal' })
  @IsNumber()
  @Min(1)
  @Max(999)
  protienGoal: number;

  @ApiProperty({ example: 250, description: 'Carbs Goal' })
  @IsNumber()
  @Min(1)
  @Max(999)
  carbsGoal: number;

  @ApiProperty({ example: 60, description: 'Fat Goal' })
  @IsNumber()
  @Min(1)
  @Max(999)
  fatGoal: number;

  @ApiProperty({ example: 'Lose weight', description: 'Fitness Goal' })
  @IsString()
  @Length(3, 100)
  goal: string;

  @ApiProperty({ enum: WeightType, example: WeightType.KG })
  @IsEnum(WeightType, {
    message: 'weight type should be kg ,g , lb',
  })
  weightType: WeightType;

  @ApiProperty({ enum: HeightType, example: HeightType.CM })
  @IsEnum(HeightType, {
    message: 'Height type should be cm,ft,mm,m,in',
  })
  heightType: HeightType;

  @ApiProperty({ enum: CaloryType, example: CaloryType.KCAL })
  @IsEnum(CaloryType, {
    message: 'Calory type should be cal,kcal',
  })
  calorieType: CaloryType;

  @ApiProperty({ enum: GenderType, example: GenderType.MALE })
  @IsString()
  @IsEnum(GenderType, {
    message: 'Gender must be one of the following values: male | female',
  })
  gender: GenderType;
}

export class CreateUserDto extends ProfileDto {
  @ApiProperty({ example: 'John Doe', description: 'Full Name' })
  @IsString()
  @Length(3, 40, {
    message: 'Full name must be between 3 and 25 characters long.',
  })
  fullName: string;

  @ApiProperty({ example: 'johndoe', description: 'Username' })
  @IsString({})
  @Length(3, 25, {
    message: 'User Name must be between 3 and 25 characters long.',
  })
  userName: string;

  @ApiProperty({ example: 'john@example.com', description: 'Email address' })
  @IsEmail()
  @Length(10, 50, {
    message: 'Email must be between 10 and 50 characters long .',
  })
  email: string;

  @ApiProperty({ example: '123456', description: 'Access PIN' })
  @IsString()
  @Length(6, 8)
  accessPin: string;

  @ApiPropertyOptional({
    enum: RoleType,
    example: RoleType.EMPLOYEE,
    description: 'User role; defaults to employee when omitted',
  })
  @IsOptional()
  @IsEnum(RoleType)
  role?: RoleType;
}

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiPropertyOptional({ example: 'john@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '1234567890' })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiPropertyOptional({ example: 'Asia/Dhaka' })
  @IsOptional()
  @IsString()
  timezone?: string;
}
