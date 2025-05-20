import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as mongoose from 'mongoose';
import * as argon2 from 'argon2';
export enum RoleType {
  ADMIN = 'admin' ,
  USER = 'user'
}

// Define the User schema using the Schema decorator
@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true, trim: true, minlength: 3, maxlength: 30 })
  fullName: string;
  @Prop({
    required: true,
    trim: true,
    unique: true,
    minlength: 6,
    maxlength: 20,
  })
  userName: string;
  @Prop({ required: true, trim: true, minlength: 6, maxlength: 20 })
  password: string;
  @Prop({
    required: true,
    unique: true,
    trim: true,
    minlength: 10,
    maxlength: 60,
  })
  email: string;
  @Prop({ enum: RoleType, default: RoleType.USER })
  role: RoleType;
  @Prop({ required:false, minlength: 6, maxlength: 10 })
  accessPin: string;
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Profile', default: null })
  profileId: mongoose.Schema.Types.ObjectId | null;
  @Prop({ default: true })
  isEmailVerified: boolean;
  @Prop({ required: false, default: '' })
  image: string | null;
  @Prop({ default: false })
  isDeleted: boolean;
}

// Create the schema and apply pre-save hook outside the class
export const UserSchema = SchemaFactory.createForClass(User);

// Pre-save hook to hash the password before saving
UserSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    try {
      this.password = await argon2.hash(this.password);
    } catch (error) {
      console.error('Error hashing password:', error);
      next(error);
    }
  }
  next();
});

UserSchema.index({ fullName: 'text', userName: 'text' });
