import { IsString, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { ObjectId } from 'mongoose';

export class LifeStyleDto {
  @IsNotEmpty()
  @IsString()
  smoking: string; // No enum, just plain string validation

  @IsNotEmpty()
  @IsString()
  drinking: string; // No enum, just plain string validation

  @IsNotEmpty()
  @IsString()
  sleepSchedule: string;

  @IsNotEmpty()
  @IsString()
  pets: string; // No enum, just plain string validation

  @IsNotEmpty()
  @IsString()
  execise: string;

  @IsNotEmpty()
  @IsString()
  education: string;

  @IsNotEmpty()
  @IsString()
  communicationStyle: string;

  @IsNotEmpty()
  @IsString()
  relationshipPreference: string;

  @IsNotEmpty()
  @IsString()
  socialMedia: string;
}
