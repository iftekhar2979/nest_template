import { Test, TestingModule } from '@nestjs/testing';
import { UserSubscriptionsController } from './user_subscriptions.controller';

describe('UserSubscriptionsController', () => {
  let controller: UserSubscriptionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserSubscriptionsController],
    }).compile();

    controller = module.get<UserSubscriptionsController>(UserSubscriptionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
