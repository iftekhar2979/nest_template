import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { Base } from '../../common/schema/base.schema';
import { BillingType, SubscriptionStatus } from '../../common/enums/db-design.enum';

@Schema({ collection: 'subscriptions' })
export class Subscription extends Base {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true })
  clientId: mongoose.Schema.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true })
  serviceId: mongoose.Schema.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'SubscriptionPlan', required: true })
  planId: mongoose.Schema.Types.ObjectId;

  @Prop({ default: undefined })
  stripeSubscriptionId: string;

  @Prop({ default: '' })
  stripeCustomerId: string;

  @Prop({ required: true, enum: BillingType })
  billingType: BillingType;

  @Prop({ enum: SubscriptionStatus, default: SubscriptionStatus.ACTIVE })
  status: SubscriptionStatus;

  @Prop({ required: true })
  startsAt: Date;

  @Prop({ default: null })
  endsAt: Date;
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);

Subscription.applyBaseHooks(SubscriptionSchema);

SubscriptionSchema.index(
  { stripeSubscriptionId: 1 },
  {
    unique: true,
    name: 'idx_subs_stripe_sub_id',
    partialFilterExpression: { stripeSubscriptionId: { $type: 'string' } },
  },
);
SubscriptionSchema.index({ stripeCustomerId: 1 }, { name: 'idx_subs_stripe_cust_id' });
SubscriptionSchema.index({ clientId: 1, status: 1 }, { name: 'idx_subs_client_status_lookup' });
SubscriptionSchema.index({ serviceId: 1, planId: 1 }, { name: 'idx_subs_service_plan' });
SubscriptionSchema.index({ status: 1, endsAt: 1 }, { name: 'idx_subs_status_expiry' });
