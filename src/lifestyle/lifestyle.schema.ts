import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as mongoose from 'mongoose';
import * as bcrypt from 'bcryptjs'; // Import bcryptjs

// Define the User schema using the Schema decorator
@Schema({ timestamps: true })
export class LifeStyle extends Document {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique:true })
  userID: mongoose.Schema.Types.ObjectId;
  @Prop({ type: String, required: true, trim: true, lowercase: true })
  smoking: string;
  @Prop({ type: String, required: true, trim: true })
  drinking: string;
  @Prop({ type: String, required: true, trim: true })
  sleepSchedule: string;
  @Prop({ type: String, required: true, trim: true })
  pets: string;
  @Prop({ type: String, required: true, trim: true })
  execise: string;
  @Prop({ type: String, required: true, trim: true })
  education: string;
  @Prop({ type: String, required: true, trim: true })
  communicationStyle: string;
  @Prop({ type: String, required: true, trim: true })
  relationshipPreference: string;
  @Prop({ type: String, required: true, trim: true })
  socialMedia: string;
}

// Create the schema and apply pre-save hook outside the class
export const LifeStyleSchema = SchemaFactory.createForClass(LifeStyle);
