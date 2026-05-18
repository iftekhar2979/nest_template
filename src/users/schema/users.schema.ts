import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import * as argon2 from 'argon2';
import { Base } from '../../common/schema/base.schema';

export enum RoleType {
  SUPERADMIN = 'superadmin',
  ADMIN = 'admin',
  HTO = 'hto',
  SALES_LEADER = 'sales_leader',
  SALES_TEAM_LEADER = 'sales_team_leader',
  SALES_MEMBER = 'sales_member',
  OPERATION_LEADER = 'operation_leader',
  OPERATION_MEMBER = 'operation_member',
  CLIENT = 'client',
}

export enum UserStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  DELETED = 'deleted',
}

@Schema()
export class User extends Base {
  @Prop({ required: true, trim: true, lowercase: true })
  email: string;

  @Prop({ required: true, select: false })
  passwordHash: string;

  @Prop({ required: false })
  phoneNumber: string;

  @Prop({ required: true, trim: true })
  fullName: string;

  @Prop({ required: false, default: '' })
  avatarUrl: string;

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

  @Prop({ enum: RoleType, default: RoleType.CLIENT })
  role: RoleType;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null })
  teamId: mongoose.Schema.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null })
  departmentId: mongoose.Schema.Types.ObjectId;

  @Prop({ required: false })
  timezone: string;

  @Prop({ default: null })
  lastLoginAt: Date;

  @Prop({ select: false })
  accessPin: string;
}

export const UserSchema = SchemaFactory.createForClass(User);

User.applyBaseHooks(UserSchema);

UserSchema.pre('save', async function (next) {
  if (this.isModified('passwordHash')) {
    try {
      this.passwordHash = await argon2.hash(this.passwordHash);
    } catch (error) {
      next(error);
    }
  }
  next();
});

UserSchema.pre('findOneAndUpdate', async function (next) {
  const update = this.getUpdate() as Record<string, any>;
  const passwordHash = update?.passwordHash ?? update?.$set?.passwordHash;

  if (passwordHash) {
    const hashedPassword = await argon2.hash(passwordHash);
    if (update.passwordHash) {
      update.passwordHash = hashedPassword;
    }
    if (update.$set?.passwordHash) {
      update.$set.passwordHash = hashedPassword;
    }
    this.setUpdate(update);
  }

  next();
});

UserSchema.index({ fullName: 'text', email: 'text' });
UserSchema.index({ email: 1 }, { unique: true, name: 'idx_users_email' });
UserSchema.index({ role: 1 }, { name: 'idx_users_role' });
UserSchema.index({ teamId: 1 }, { name: 'idx_users_team_id' });
UserSchema.index({ departmentId: 1 }, { name: 'idx_users_dept_id' });
UserSchema.index(
  { subscriptionStatus: 1, accessExpiresAt: 1 },
  { name: 'idx_users_subscription_lookup' },
);
UserSchema.index({ createdAt: 1 }, { name: 'idx_users_created_at' });
