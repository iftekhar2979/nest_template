import { Test, TestingModule } from '@nestjs/testing';
import { LearningMaterialsController } from './learning_materials.controller';

describe('LearningMaterialsController', () => {
  let controller: LearningMaterialsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LearningMaterialsController],
    }).compile();

    controller = module.get<LearningMaterialsController>(LearningMaterialsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
