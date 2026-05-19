import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { Base } from '../../common/schema/base.schema';
import { SubscriptionStatus } from '../../common/enums/db-design.enum';

@Schema({ collection: 'user_subscriptions' })
export class UserSubscription extends Base {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  userId: mongoose.Schema.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'SubscriptionPlan', required: true })
  planId: mongoose.Schema.Types.ObjectId;

  @Prop({ enum: SubscriptionStatus, default: SubscriptionStatus.TRIALING })
  status: SubscriptionStatus;

  @Prop({ default: '' })
  gatewayCustomerId: string;

  @Prop({ default: undefined })
  gatewaySubId: string;

  @Prop({ default: null })
  currentPeriodStart: Date;

  @Prop({ default: null })
  currentPeriodEnd: Date;
}

export const UserSubscriptionSchema = SchemaFactory.createForClass(UserSubscription);

UserSubscription.applyBaseHooks(UserSubscriptionSchema);

UserSubscriptionSchema.index({ userId: 1 }, { name: 'idx_user_subs_user_id' });
UserSubscriptionSchema.index({ planId: 1 }, { name: 'idx_user_subs_plan_id' });
UserSubscriptionSchema.index(
  { gatewaySubId: 1 },
  {
    unique: true,
    name: 'idx_user_subs_gateway_sub_id',
    partialFilterExpression: { gatewaySubId: { $type: 'string' } },
  },
);
