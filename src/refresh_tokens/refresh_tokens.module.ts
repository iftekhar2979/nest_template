import { Module } from '@nestjs/common';
import { RefreshTokensController } from './refresh_tokens.controller';
import { RefreshTokensService } from './refresh_tokens.service';

@Module({
  controllers: [RefreshTokensController],
  providers: [RefreshTokensService]
})
export class RefreshTokensModule {}
