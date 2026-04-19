import { Module } from '@nestjs/common';
import { LearningMaterialsController } from './learning_materials.controller';
import { LearningMaterialsService } from './learning_materials.service';

@Module({
  controllers: [LearningMaterialsController],
  providers: [LearningMaterialsService]
})
export class LearningMaterialsModule {}
