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
import { ObjectId } from 'mongoose';

export class ProfileDto {
  @IsMongoId() // Ensure the userID is a valid MongoDB ObjectId
  userID: ObjectId;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsString()
  @IsOptional()
  country: string;

  @IsOptional()
  @IsString()
  profilePictureUrl?: string;

  @IsOptional()
  @IsArray()
  languages?: [string];
  
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dOB?: Date;

  @IsOptional()
  @IsString()
  education?: string;

  @IsOptional()
  @IsString()
  height?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  subscribedPlanID?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  lifeStyle?: string[];

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsObject()
  location?: {
    type: string;
    coordinates: [number, number]; // Coordinates (longitude, latitude)
  };

  @IsOptional()
  @IsNumber()
  age?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  values?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  interest?: string[];

  @IsMongoId()
  @IsOptional()
  galleryID: ObjectId;

  @IsOptional()
  @IsBoolean()
  isDeleted?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isSubscribed?: boolean;

  @IsOptional()
  @IsBoolean()
  isBatchAvailable?: boolean;
}
