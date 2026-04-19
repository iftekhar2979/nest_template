import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Base } from '../../common/schema/base.schema';

@Schema()
export class SubscriptionPlan extends Base {
  @Prop({ required: true, unique: true, trim: true })
  name: string; // e.g. Monthly, Yearly, Lifetime

  @Prop({ required: true, enum: ['monthly', 'yearly', 'lifetime'] })
  planType: string;

  @Prop({ required: true, type: Number })
  price: number;

  @Prop({ default: 'USD' })
  currency: string;

  @Prop({ required: false })
  durationDays: number; // 30, 365, null for lifetime

  @Prop({ required: false })
  description: string;
}

export const SubscriptionPlanSchema = SchemaFactory.createForClass(SubscriptionPlan);

SubscriptionPlan.applyBaseHooks(SubscriptionPlanSchema);
