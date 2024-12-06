import { error } from 'console';
import { UserService } from 'src/users/users.service';
import { Body, Controller, Post, ExceptionFilter, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import { authDto } from './dto/auth.dto';
import { CreateUserDto } from 'src/users/dto/createUser.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @Post('/register')
  async create(@Body() createUserDto: CreateUserDto) {
    return this.authService.create(createUserDto);
  }
  @Post('login')
  async login(@Body() authDto: authDto) {
    return this.authService.find(authDto);
  }
  @Post('verify-otp')
  async verifyOtp(@Query() authDto: authDto) {
    return this.authService.find(authDto);
  }
}
