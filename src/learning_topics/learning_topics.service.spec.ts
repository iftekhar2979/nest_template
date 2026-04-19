import { Test, TestingModule } from '@nestjs/testing';
import { LearningTopicsService } from './learning_topics.service';

describe('LearningTopicsService', () => {
  let service: LearningTopicsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LearningTopicsService],
    }).compile();

    service = module.get<LearningTopicsService>(LearningTopicsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
