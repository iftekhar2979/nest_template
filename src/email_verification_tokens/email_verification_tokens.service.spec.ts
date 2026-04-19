import { Test, TestingModule } from '@nestjs/testing';
import { EmailVerificationTokensService } from './email_verification_tokens.service';

describe('EmailVerificationTokensService', () => {
  let service: EmailVerificationTokensService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EmailVerificationTokensService],
    }).compile();

    service = module.get<EmailVerificationTokensService>(EmailVerificationTokensService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
