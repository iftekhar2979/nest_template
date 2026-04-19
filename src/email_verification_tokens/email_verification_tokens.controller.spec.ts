import { Test, TestingModule } from '@nestjs/testing';
import { EmailVerificationTokensController } from './email_verification_tokens.controller';

describe('EmailVerificationTokensController', () => {
  let controller: EmailVerificationTokensController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmailVerificationTokensController],
    }).compile();

    controller = module.get<EmailVerificationTokensController>(EmailVerificationTokensController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
