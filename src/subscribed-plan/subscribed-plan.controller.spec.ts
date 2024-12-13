import { Test, TestingModule } from '@nestjs/testing';
import { SubscribedPlanController } from './subscribed-plan.controller';

describe('SubscribedPlanController', () => {
  let controller: SubscribedPlanController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubscribedPlanController],
    }).compile();

    controller = module.get<SubscribedPlanController>(SubscribedPlanController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
