import { Module } from '@nestjs/common';
import { LearningTopicsController } from './learning_topics.controller';
import { LearningTopicsService } from './learning_topics.service';

@Module({
  controllers: [LearningTopicsController],
  providers: [LearningTopicsService]
})
export class LearningTopicsModule {}
