import {
  Body,
  Controller,
  Post,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Request } from 'express';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import {
  LoginDto,
  RegisterDto,
  VerifyOtpDto,
  RefreshTokenDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto/auth.dto';
import { JwtAuthGuard } from './guard/jwt-auth.guard';
import { ThrottlerBehindProxyGuard } from '../shared/guards/throttler-behind-proxy.guard';
import { AuthRateLimitGuard } from './guard/auth-rate-limit.guard';
import { AuthRateLimit } from './decorators/auth-rate-limit.decorator';

type RequestUser = {
  sub: string;
};

type AuthenticatedRequest = Request & {
  user: RequestUser;
};

@Controller('auth')
@UseGuards(AuthRateLimitGuard, ThrottlerBehindProxyGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @AuthRateLimit('register')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('verify-otp')
  @AuthRateLimit('verify-otp')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto, @Req() req: Request) {
    return this.authService.verifyOtp(
      verifyOtpDto,
      this.getRequestContext(req),
    );
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @AuthRateLimit('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async login(@Body() loginDto: LoginDto, @Req() req: Request) {
    return this.authService.login(loginDto, this.getRequestContext(req));
  }

  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @AuthRateLimit('refresh-token')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async refreshToken(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Req() req: Request,
  ) {
    return this.authService.refreshToken(
      refreshTokenDto,
      this.getRequestContext(req),
    );
  }

  @Post('logout')
  @AuthRateLimit('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.authService.logout(refreshTokenDto.refreshToken, req.user.sub);
  }

  @Post('logout-all')
  @AuthRateLimit('logout-all')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logoutAll(@Req() req: AuthenticatedRequest) {
    return this.authService.logoutAll(req.user.sub);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @AuthRateLimit('forgot-password')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @AuthRateLimit('reset-password')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  private getRequestContext(req: Request) {
    return {
      ip: req.ip,
      userAgent: req.get('user-agent'),
    };
  }
}
