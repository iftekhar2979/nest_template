import { error } from 'console';
import { UserService } from 'src/users/users.service';
import {
  Body,
  Controller,
  Post,
  ExceptionFilter,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { authDto, forgetPasswordDto, resetPasswordDto } from './dto/auth.dto';
import { CreateUserDto } from 'src/users/dto/createUser.dto';
import { JwtAuthGuard } from './guard/jwt-auth.guard';
import { Roles } from 'src/common/custom-decorator/role.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @Post('register')
  async create(@Body() createUserDto: CreateUserDto) {
    return this.authService.create(createUserDto);
  }
  @Post('login')
  async login(@Body() authDto: authDto) {
    return this.authService.find(authDto);
  }
  @Post('verify-otp')
  @UseGuards(JwtAuthGuard)
  VerifyOtp(@Request() req, @Body() body: { code: string }) {
    const user = req.user; // Access user data from JWT
    const code = body.code;
    return this.authService.verifyOtp(user, code);
  }
  @Post('resend-otp')
  @UseGuards(JwtAuthGuard)
  resendOtp(@Request() req) {
    const user = req.user; // Access user data from JWT
    return this.authService.resendOtp(user);
  }
  @Post('reset-password')
  @UseGuards(JwtAuthGuard)
  resetPassword(@Request() req, @Body() resetPasswordDto: resetPasswordDto) {
    const user = req.user; // Access user data from JWT
    return this.authService.resetPassword(user, resetPasswordDto);
  }
  @Post('forget-password')
  @UseGuards(JwtAuthGuard)
  forgetPassword(@Request() req, @Body() forgetPasswordDto:forgetPasswordDto) {
    const user = req.user; // Access user data from JWT
    return this.authService.forgetPassword(user, forgetPasswordDto);
  }
}
