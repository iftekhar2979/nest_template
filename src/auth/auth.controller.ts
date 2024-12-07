import { error } from 'console';
import { UserService } from 'src/users/users.service';
import { Body, Controller, Post, ExceptionFilter, Query, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { authDto } from './dto/auth.dto';
import { CreateUserDto } from 'src/users/dto/createUser.dto';
import { JwtAuthGuard } from './guard/jwt-auth.guard';
import { Roles } from 'src/common/custom-decorator/role.decorator';

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
  @UseGuards(JwtAuthGuard)
  // @Roles("admin")
  getProfile(@Request() req) {
    const user = req.user; // Access user data from JWT
    return {
      message: `Welcome, ${user.name}!`,
      user,
    };
  }
}
