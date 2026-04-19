import { Module } from '@nestjs/common';
import { UserAnswersService } from './user_answers.service';

@Module({
  providers: [UserAnswersService]
})
export class UserAnswersModule {}
