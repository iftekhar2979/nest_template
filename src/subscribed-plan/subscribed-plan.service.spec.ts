import { Test, TestingModule } from '@nestjs/testing';
import { SubscribedPlanService } from './subscribed-plan.service';

describe('SubscribedPlanService', () => {
  let service: SubscribedPlanService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SubscribedPlanService],
    }).compile();

    service = module.get<SubscribedPlanService>(SubscribedPlanService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
