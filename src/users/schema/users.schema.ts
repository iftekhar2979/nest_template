import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import * as argon2 from 'argon2';
import { Base } from '../../common/schema/base.schema';

export enum RoleType {
  ADMIN = 'admin',
  USER = 'user',
}

@Schema()
export class User extends Base {
  @Prop({ required: true, unique: true, trim: true, lowercase: true })
  email: string;

  @Prop({ required: true, select: false })
  password: string;

  @Prop({ required: false })
  phoneNumber: string;

  @Prop({ required: true, trim: true })
  fullName: string;

  @Prop({ required: false, default: '' })
  avatarUrl: string;

  @Prop({ required: false })
  dateOfBirth: Date;

  @Prop({ required: false })
  gender: string;

  @Prop({ required: false })
  employment: string;

  @Prop({ required: false })
  education: string;

  @Prop({ required: false })
  university: string;

  @Prop({ required: false })
  linkedinUrl: string;

  @Prop({ default: 0 })
  totalScore: number;

  @Prop({ default: false })
  isEmailVerified: boolean;

  @Prop({ default: false })
  isTcPpAccepted: boolean;

  @Prop({ default: null })
  emailVerifiedAt: Date;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'SubscriptionPlan', default: null })
  activePlanId: mongoose.Schema.Types.ObjectId;

  @Prop({ required: false })
  subscriptionStatus: string; // active | expired | cancelled | trialing

  @Prop({ default: null })
  accessExpiresAt: Date;

  @Prop({ enum: RoleType, default: RoleType.USER })
  role: RoleType;

  @Prop({ default: null })
  lastLoginAt: Date;

  @Prop({ select: false })
  accessPin: string;
}

export const UserSchema = SchemaFactory.createForClass(User);

User.applyBaseHooks(UserSchema);

UserSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    try {
      this.password = await argon2.hash(this.password);
    } catch (error) {
      next(error);
    }
  }
  next();
});

UserSchema.index({ fullName: 'text', email: 'text' });
