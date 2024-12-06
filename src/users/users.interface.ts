import mongoose from "mongoose";

export interface IUser {
  name: string;
  password: string;
  email:string;
  phone:string;
  role:"user" | "admin" ;
  profileID:mongoose.Schema.Types.ObjectId | null;
  galleryID:mongoose.Schema.Types.ObjectId | null;
  privacyPolicyAccepted: boolean;
  isEmailVerified:boolean;
  isVerifiedByAdmin : boolean;
  isBlockedByAdmin:boolean; 
  isDeleted:boolean;
}