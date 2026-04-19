import { Module } from '@nestjs/common';
import { EmailVerificationTokensController } from './email_verification_tokens.controller';
import { EmailVerificationTokensService } from './email_verification_tokens.service';

@Module({
  controllers: [EmailVerificationTokensController],
  providers: [EmailVerificationTokensService]
})
export class EmailVerificationTokensModule {}
