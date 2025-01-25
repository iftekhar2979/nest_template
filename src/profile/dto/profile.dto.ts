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
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ObjectId } from 'mongoose';

export class ProfileDto {
  @IsOptional()
  @IsMongoId() // Ensure the userID is a valid MongoDB ObjectId
  userID?: ObjectId;
  @IsString()
  fullName: string;
  @IsString()
  bio?: string;

  @IsDate()
  @Type(() => Date)
  dOB?: Date;

  @IsString({ message: 'Gender must string' })
  @IsEnum(['male', 'female', 'other'], {
    message:
      'Gender must be one of the following values: male | female | other 🙂',
  })
  gender?: string;

  @IsOptional()
  @IsObject()
  location?: {
    type: string;
    coordinates: [number, number]; // Coordinates (longitude, latitude)
  };
}
