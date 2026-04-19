import { Test, TestingModule } from '@nestjs/testing';
import { QuizQuestionsController } from './quiz_questions.controller';

describe('QuizQuestionsController', () => {
  let controller: QuizQuestionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QuizQuestionsController],
    }).compile();

    controller = module.get<QuizQuestionsController>(QuizQuestionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
