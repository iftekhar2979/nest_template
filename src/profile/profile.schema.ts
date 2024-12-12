import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as mongoose from 'mongoose';
import * as bcrypt from 'bcryptjs'; // Import bcryptjs
import { LifeStyle } from 'src/lifestyle/lifestyle.schema';

// Define the User schema using the Schema decorator
@Schema({ timestamps: true })
export class Profile extends Document {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  })
  userID: mongoose.Schema.Types.ObjectId;
  @Prop()
  bio: string;
  @Prop({ required: false, trim: true })
  country: string;
  @Prop()
  profilePictureUrl: string;
  @Prop({ type: Array })
  languages: [string];
  @Prop({ required: true })
  dOB: Date;
  @Prop()
  education: string;
  @Prop()
  height: string;
  @Prop()
  gender: string;
  @Prop()
  subscribedPlanID: string;
  @Prop({ type: Array })
  lifeStyle: [string];
  @Prop()
  address: string;
  @Prop({ type: Object })
  location: {
    type: 'Point';
    coordinates: [number];
  };
  @Prop()
  age: number;
  @Prop({ type: Array })
  values: [string];
  @Prop({ type: Array })
  interest: [string];
  @Prop({ default: false })
  isDeleted: boolean;
  @Prop({ default: false })
  isActive: boolean;
  @Prop({ default: false })
  isSubscribed: boolean;
  @Prop({ default: false })
  isBatchAvailable: boolean;
}

// Create the schema and apply pre-save hook outside the class
export const ProfileSchema = SchemaFactory.createForClass(Profile);
ProfileSchema.index({insert:"text",values:"text",lifeStyle:"text",gender:"text"})
