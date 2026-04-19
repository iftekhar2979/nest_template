import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { Base } from '../../common/schema/base.schema';

@Schema()
export class UserBadge extends Base {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true })
  userId: mongoose.Schema.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Badge', required: true, index: true })
  badgeId: mongoose.Schema.Types.ObjectId;

  @Prop({ default: Date.now })
  awardedAt: Date;
}

export const UserBadgeSchema = SchemaFactory.createForClass(UserBadge);

UserBadge.applyBaseHooks(UserBadgeSchema);

UserBadgeSchema.index({ userId: 1, badgeId: 1 }, { unique: true });
