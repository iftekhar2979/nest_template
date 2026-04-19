import { Module } from '@nestjs/common';
import { QuizAttemptsController } from './quiz_attempts.controller';

@Module({
  controllers: [QuizAttemptsController]
})
export class QuizAttemptsModule {}
