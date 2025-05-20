import mongoose from "mongoose";


export interface IUserProfile {
  // 🟢 User fields
  _id?: mongoose.Schema.Types.ObjectId; // optional if returned from DB
  fullName: string;
  userName: string;
  password: string;
  email: string;
  role: 'user' | 'admin';
  accessPin: string;
  profileId?: mongoose.Schema.Types.ObjectId | null;
  isEmailVerified: boolean;
  image?: string | null;
  isDeleted: boolean;

}

export interface IProfile{
  
  userId: mongoose.Schema.Types.ObjectId;
  dOB: Date;
  height: string;
  weight: string;
  weightType: 'kg' | 'g' | 'lb';
  calorieType: 'cal' | 'kcal';
  heightType: 'cm' | 'ft' | 'mm' | 'm' | 'in';
  goal: string;
  weightGoal: string;
  caloryGoal: number;
  protienGoal: number;
  carbsGoal: number;
  fatGoal: number;
  gender: 'male' | 'female';
}