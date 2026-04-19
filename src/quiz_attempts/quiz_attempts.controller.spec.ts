import { Test, TestingModule } from '@nestjs/testing';
import { QuizAttemptsController } from './quiz_attempts.controller';

describe('QuizAttemptsController', () => {
  let controller: QuizAttemptsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QuizAttemptsController],
    }).compile();

    controller = module.get<QuizAttemptsController>(QuizAttemptsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
