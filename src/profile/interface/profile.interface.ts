import { interestAndValues } from './../dto/lifeStyleAndValues.dto';
import { Document, Types } from 'mongoose';

export interface IProfile extends Document {
  userID: Types.ObjectId; // Reference to the User model
  bio?: string;
  country: string;
  profilePictureUrl?: string;
  languages?: string;
  dOB?: Date;
  education?: string;
  height?: string;
  gender?: string;
  subscribedPlanID?: string;
  lifeStyle?: string[];
  address?: string;
  location?: {
    type: 'Point';
    coordinates: [number, number]; // Coordinates (longitude, latitude)
  };
  age?: number;
  values?: string[];
  interest?: string[];
  galleryID: Types.ObjectId; // Reference to the Gallery model
  isDeleted?: boolean;
  isActive?: boolean;
  isSubscribed?: boolean;
  isBatchAvailable?: boolean;
}
export interface Location{
    type: 'Point';
    coordinates: [number, number]; // Coordinates (longitude, latitude)
 
}
export interface userLifeStyle {
  userID?:Types.ObjectId |string
  smoking: string;
  drinking: string;
  sleepSchedule: string;
  pets: string;
  execise: string;
  education: string;
  communicationStyle: string;
  relationshipPreference: string;
  socialMedia: string;
}

export interface InterestAndValuesAttributes {
  values: string[];
  interest: string[];
}
