import { Module } from '@nestjs/common';
import { QuizQuestionsController } from './quiz_questions.controller';
import { QuizQuestionsService } from './quiz_questions.service';

@Module({
  controllers: [QuizQuestionsController],
  providers: [QuizQuestionsService]
})
export class QuizQuestionsModule {}
