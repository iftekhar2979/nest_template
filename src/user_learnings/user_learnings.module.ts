import { Module } from '@nestjs/common';
import { UserLearningsController } from './user_learnings.controller';

@Module({
  controllers: [UserLearningsController]
})
export class UserLearningsModule {}
