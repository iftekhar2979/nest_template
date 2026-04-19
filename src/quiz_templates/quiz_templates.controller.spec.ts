import { Test, TestingModule } from '@nestjs/testing';
import { QuizTemplatesController } from './quiz_templates.controller';

describe('QuizTemplatesController', () => {
  let controller: QuizTemplatesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QuizTemplatesController],
    }).compile();

    controller = module.get<QuizTemplatesController>(QuizTemplatesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
