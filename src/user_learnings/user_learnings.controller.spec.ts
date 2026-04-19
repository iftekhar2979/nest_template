import { Test, TestingModule } from '@nestjs/testing';
import { UserLearningsController } from './user_learnings.controller';

describe('UserLearningsController', () => {
  let controller: UserLearningsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserLearningsController],
    }).compile();

    controller = module.get<UserLearningsController>(UserLearningsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
