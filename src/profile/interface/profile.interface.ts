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
