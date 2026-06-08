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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
  LoginDto,
  RegisterDto,
  VerifyOtpDto,
  RefreshTokenDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto/auth.dto';
import {
  AuthResponseDto,
  RegisterResponseDto,
  ForgotPasswordResponseDto,
  MessageResponseDto,
  OtpVerifyResponseDto,
} from './dto/auth-response.dto';
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

@ApiTags('Authentication')
@Controller('auth')
@UseGuards(AuthRateLimitGuard, ThrottlerBehindProxyGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @AuthRateLimit('register')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Register a new user account' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User successfully registered. OTP verification required.',
    type: RegisterResponseDto,
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data or T&C not accepted.' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'User with this email already exists.' })
  @ApiResponse({ status: HttpStatus.TOO_MANY_REQUESTS, description: 'Rate limit exceeded.' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('verify-otp')
  @AuthRateLimit('verify-otp')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Verify OTP code for email verification or password reset' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'OTP verified successfully.',
    type: OtpVerifyResponseDto,
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid or expired verification token.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid or expired OTP code.' })
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
  @ApiOperation({ summary: 'User login to receive access and refresh tokens' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Login successful.',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Email verification required.',
    type: RegisterResponseDto,
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid credentials.' })
  async login(@Body() loginDto: LoginDto, @Req() req: Request) {
    return this.authService.login(loginDto, this.getRequestContext(req));
  }

  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @AuthRateLimit('refresh-token')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Refresh JWT access token using a valid refresh token' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tokens refreshed successfully.',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid or expired refresh token.' })
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
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout from the current device' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Logged out successfully.',
    type: MessageResponseDto,
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid access token or refresh token.' })
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
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout from all devices and revoke all refresh tokens' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Logged out from all devices successfully.',
    type: MessageResponseDto,
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid access token.' })
  async logoutAll(@Req() req: AuthenticatedRequest) {
    return this.authService.logoutAll(req.user.sub);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @AuthRateLimit('forgot-password')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @ApiOperation({ summary: 'Request a password reset OTP' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'If an account exists, a password reset OTP has been sent.',
    type: ForgotPasswordResponseDto,
  })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @AuthRateLimit('reset-password')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Reset password using a valid reset token' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password reset successful.',
    type: MessageResponseDto,
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid or expired reset token.' })
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
