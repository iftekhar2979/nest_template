import { Module } from '@nestjs/common';
import { QuizTemplatesController } from './quiz_templates.controller';

@Module({
  controllers: [QuizTemplatesController]
})
export class QuizTemplatesModule {}
