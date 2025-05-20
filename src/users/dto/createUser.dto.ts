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
} from 'class-validator';

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
  @IsDateString()
  dOB: string;
  @IsString()
  @Length(1, 2)
  height: string;
  @IsNumberString()
  @Length(1, 3)
  weight: string;
  @IsNumber()
  weightGoal: Number;
  @IsNumber()
  @Min(1)
  @Max(999)
  caloryGoal: Number;
  @IsNumber()
  @Min(1)
  @Max(999)
  protienGoal: Number;
  @IsNumber()
  @Min(1)
  @Max(999)
  carbsGoal: Number;
  @IsNumber()
  @Min(1)
  @Max(999)
  fatGoal: Number;
  @IsString()
  @Length(3, 20)
  goal: string;
  @IsEnum(WeightType, {
    message: 'weight type should be kg ,g , lb',
  })
  weightType: WeightType;
  @IsEnum(HeightType, {
    message: 'Height type should be cm,ft,mm,m,in',
  })
  heightType: HeightType;
  @IsEnum(CaloryType, {
    message: 'Calory type should be cal,kcal',
  })
  calorieType: CaloryType;
  @IsString()
  @IsEnum(GenderType, {
    message: 'Gender must be one of the following values: male | female',
  })
  gender: GenderType;
}

export class CreateUserDto extends ProfileDto {
  @IsString()
  @Length(3, 40, {
    message: 'Full name must be between 3 and 25 characters long.',
  })
  fullName: string;
  @IsString({})
  @Length(3, 25, {
    message: 'User Name must be between 3 and 25 characters long.',
  })
  userName: string;
  @IsEmail()
  @Length(10, 30, {
    message: 'Email must be between 10 and 30 characters long .',
  })
  email: string;
  @IsString()
  @Length(6, 8)
  accessPin: string;
}
