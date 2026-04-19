import { Test, TestingModule } from '@nestjs/testing';
import { QuizQuestionsService } from './quiz_questions.service';

describe('QuizQuestionsService', () => {
  let service: QuizQuestionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QuizQuestionsService],
    }).compile();

    service = module.get<QuizQuestionsService>(QuizQuestionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
