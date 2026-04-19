import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { Base } from '../../common/schema/base.schema';

@Schema()
export class UserSubscription extends Base {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true })
  userId: mongoose.Schema.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'SubscriptionPlan', required: true, index: true })
  planId: mongoose.Schema.Types.ObjectId;

  @Prop({ required: true, enum: ['active', 'expired', 'cancelled', 'refunded'] })
  status: string;

  @Prop({ required: true, default: Date.now })
  startedAt: Date;

  @Prop({ default: null })
  expiresAt: Date;

  @Prop({ default: null })
  cancelledAt: Date;

  @Prop({ required: false })
  paymentProvider: string; // stripe | paddle | manual

  @Prop({ required: false })
  paymentRef: string;

  @Prop({ type: Number })
  amountPaid: number;

  @Prop({ default: 'USD' })
  currency: string;
}

export const UserSubscriptionSchema = SchemaFactory.createForClass(UserSubscription);

UserSubscription.applyBaseHooks(UserSubscriptionSchema);

UserSubscriptionSchema.index({ userId: 1, status: 1 });
