import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { Document } from 'mongoose';
import { SubscriptionInterval } from '../../common/enums/db-design.enum';

@Schema({ collection: 'subscription_plans', timestamps: { createdAt: 'createdAt', updatedAt: false } })
export class SubscriptionPlan extends Document {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true })
  serviceId: mongoose.Schema.Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true })
  price: number;

  @Prop({ default: 'USD', uppercase: true, trim: true })
  currency: string;

  @Prop({ required: true, enum: SubscriptionInterval })
  interval: SubscriptionInterval;

  @Prop({ default: null })
  durationDays: number;

  @Prop({ default: true })
  isActive: boolean;

  createdAt: Date;
}

export const SubscriptionPlanSchema = SchemaFactory.createForClass(SubscriptionPlan);

SubscriptionPlanSchema.index({ serviceId: 1 }, { name: 'idx_plans_service_id' });
SubscriptionPlanSchema.index({ isActive: 1, interval: 1 }, { name: 'idx_plans_active_interval' });
SubscriptionPlanSchema.index({ interval: 1, durationDays: 1 }, { name: 'idx_plans_type_duration' });
SubscriptionPlanSchema.index({ price: 1 }, { name: 'idx_plans_price_sorting' });
