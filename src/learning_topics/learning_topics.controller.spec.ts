import { Test, TestingModule } from '@nestjs/testing';
import { LearningTopicsController } from './learning_topics.controller';

describe('LearningTopicsController', () => {
  let controller: LearningTopicsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LearningTopicsController],
    }).compile();

    controller = module.get<LearningTopicsController>(LearningTopicsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
