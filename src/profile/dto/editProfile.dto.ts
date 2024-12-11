import {
  IsString,
  IsOptional,
  IsArray,
  IsBoolean,
  IsDate,
  IsNumber,
  IsObject,
  IsMongoId,
  IsLatitude,
  IsLongitude,
} from 'class-validator';
import { Type } from 'class-transformer';

export class EditProfileBasicInfoDto {
  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dOB?: Date;

  @IsString()
  @IsOptional()
  country: string;

  @IsOptional()
  @IsArray()
  languages?: [string];

  @IsOptional()
  @IsString()
  education?: string;

  @IsOptional()
  @IsString()
  height?: string;

  @IsOptional()
  @IsNumber()
  age?: number;
}
