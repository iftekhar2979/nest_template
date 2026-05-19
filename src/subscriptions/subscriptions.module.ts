import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SubscriptionPlan, SubscriptionPlanSchema } from './schema/subscription-plans.schema';
import { Subscription, SubscriptionSchema } from './schema/subscriptions.schema';
import { UserSubscription, UserSubscriptionSchema } from './schema/user-subscriptions.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SubscriptionPlan.name, schema: SubscriptionPlanSchema },
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: UserSubscription.name, schema: UserSubscriptionSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class SubscriptionsModule {}
