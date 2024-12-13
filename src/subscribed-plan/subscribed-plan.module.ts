import { Module } from '@nestjs/common';
import { SubscribedPlanController } from './subscribed-plan.controller';
import { SubscribedPlanService } from './subscribed-plan.service';

@Module({
  controllers: [SubscribedPlanController],
  providers: [SubscribedPlanService]
})
export class SubscribedPlanModule {}
