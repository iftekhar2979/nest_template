import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as mongoose from 'mongoose';
import * as bcrypt from 'bcryptjs'; // Import bcryptjs

// Define the User schema using the Schema decorator
@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true, unique: true, trim: true })
  email: string;

  @Prop({ required: true, unique: true })
  phone: string;

  @Prop({ enum: ['user', 'admin'], default: 'user' })
  role: 'user' | 'admin';

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Profile', unique: true })
  profileID: mongoose.Schema.Types.ObjectId | null;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Profile', default: null })
  galleryID: mongoose.Schema.Types.ObjectId | null;

  @Prop({ required: true })
  privacyPolicyAccepted: boolean;

  @Prop({ default: false })
  isEmailVerified: boolean;

  @Prop({ default: false })
  isVerifiedByAdmin: boolean;

  @Prop({ default: false })
  isBlockedByAdmin: boolean;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ enum: ['google', 'facebook', 'custom'], default: 'custom' })
  userCreatedMethod: string;
}

// Create the schema and apply pre-save hook outside the class
export const UserSchema = SchemaFactory.createForClass(User);

// Pre-save hook to hash the password before saving
UserSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    // Only hash password if it was modified
    const salt = await bcrypt.genSalt(10); // Generate salt with 10 rounds
    this.password = await bcrypt.hash(this.password, salt); // Hash password
  }
  next(); // Proceed with saving the user
});
