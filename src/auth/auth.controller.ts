import {
  Body,
  Controller,
  Post,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
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

@Controller('auth')
@UseGuards(ThrottlerBehindProxyGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('verify-email')
  @UseGuards(JwtAuthGuard)
  async verifyEmail(@Request() req, @Body() verifyOtpDto: VerifyOtpDto) {
    return this.authService.verifyEmail(req.user.sub, verifyOtpDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async login(@Body() loginDto: LoginDto, @Request() req) {
    return this.authService.login(loginDto, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }

  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto, @Request() req) {
    return this.authService.refreshToken(refreshTokenDto, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.logout(refreshTokenDto.refreshToken);
  }

  @Post('logout-all')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logoutAll(@Request() req) {
    return this.authService.logoutAll(req.user.sub);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }
}
