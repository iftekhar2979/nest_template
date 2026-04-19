import { Module } from '@nestjs/common';
import { UserBadgesController } from './user_badges.controller';
import { UserBadgesService } from './user_badges.service';

@Module({
  controllers: [UserBadgesController],
  providers: [UserBadgesService]
})
export class UserBadgesModule {}
