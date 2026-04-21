import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import * as argon2 from 'argon2';
import {
  RegisterDto,
  LoginDto,
  VerifyOtpDto,
  RefreshTokenDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto/auth.dto';
import { UserRepository } from '../users/users.repository';
import { OtpRepository } from './repositories/otp.repository';
import { RefreshTokenRepository } from './repositories/refresh-token.repository';
import { generateOtp } from '../common/utils/generateOtp';
import { AUTH_CONSTANTS } from './constants/auth.constants';
import { User } from '../users/schema/users.schema';
import { ObjectId, Types } from 'mongoose';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly otpRepository: OtpRepository,
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectQueue('EMAIL_QUEUE') private readonly emailQueue: Queue,
  ) { }

  async register(registerDto: RegisterDto) {
    const existingUser = await this.userRepository.findByEmail(registerDto.email);
    if (existingUser) {
      throw new BadRequestException('User with this email already exists!');
    }

    // Create user with isEmailVerified = false
    const newUser = await this.userRepository.create({
      ...registerDto,
      isEmailVerified: false,
    });

    // Generate and save OTP
    const otpCode = generateOtp();
    const expiryDate = new Date();
    expiryDate.setMinutes(expiryDate.getMinutes() + AUTH_CONSTANTS.OTP.EXPIRY_MINUTES);

    await this.otpRepository.create({
      userID: newUser['_id'],
      oneTimePassword: otpCode,
      expiredAt: expiryDate,
    });

    // Push to BullMQ
    await this.emailQueue.add('sendOtp', {
      email: newUser.email,
      otp: otpCode,
      fullName: newUser.fullName,
    });

    return {
      message: 'Registration successful. Please check your email for the OTP.',
      userId: newUser['_id'],
    };
  }

  async verifyEmail(userId: Types.ObjectId, verifyOtpDto: VerifyOtpDto) {
    const otpRecord = await this.otpRepository.findByUserIdAndCode(userId, verifyOtpDto.code);

    if (!otpRecord) {
      const existingOtp = await this.otpRepository.findByUserId(userId);
      if (existingOtp) {
        await this.otpRepository.incrementAttempts(existingOtp._id as Types.ObjectId);
      }
      throw new BadRequestException('Invalid or expired OTP');
    }

    if (otpRecord.expiredAt < new Date()) {
      throw new BadRequestException('OTP has expired');
    }

    // Update user
    await this.userRepository.updateById(userId, {
      isEmailVerified: true,
      emailVerifiedAt: new Date(),
    });

    // Delete OTP
    await this.otpRepository.deleteByUserId(userId);

    return { message: 'Email verified successfully' };
  }

  async login(loginDto: LoginDto) {
    const user = await this.userRepository.findByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await argon2.verify(user.password, loginDto.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isEmailVerified) {
      // Invalidate existing sessions
      await this.refreshTokenRepository.revokeAllByUserId(user['_id']);

      // Generate and save a new OTP
      const otpCode = generateOtp();
      const expiryDate = new Date();
      expiryDate.setMinutes(expiryDate.getMinutes() + AUTH_CONSTANTS.OTP.EXPIRY_MINUTES);

      await this.otpRepository.deleteByUserId(user['_id']);
      await this.otpRepository.create({
        userID: user['_id'],
        oneTimePassword: otpCode,
        expiredAt: expiryDate,
      });

      // Push email task to BullMQ
      await this.emailQueue.add('sendOtp', {
        email: user.email,
        otp: otpCode,
        fullName: user.fullName,
      });

      throw new ForbiddenException('Please verify your email first. A new OTP has been sent to your email.');
    }

    return this.generateTokens(user);
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto) {
    const { refreshToken } = refreshTokenDto;

    let payload;
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET') || this.configService.get('JWT_SECRET'),
      });
    } catch (e) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokenRecord = await this.refreshTokenRepository.findByToken(refreshToken);
    if (!tokenRecord || tokenRecord.isRevoked || tokenRecord.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.userRepository.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Revoke old token
    await this.refreshTokenRepository.revokeByToken(refreshToken);

    // Issue new tokens
    return this.generateTokens(user);
  }

  async logout(refreshToken: string) {
    await this.refreshTokenRepository.revokeByToken(refreshToken);
    return { message: 'Logged out successfully' };
  }

  async logoutAll(userId: Types.ObjectId) {
    await this.refreshTokenRepository.revokeAllByUserId(userId);
    return { message: 'Logged out from all devices' };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.userRepository.findByEmail(forgotPasswordDto.email);
    if (!user) {
      return { message: 'If an account exists, an OTP has been sent.' };
    }

    const otpCode = generateOtp();
    const expiryDate = new Date();
    expiryDate.setMinutes(expiryDate.getMinutes() + AUTH_CONSTANTS.OTP.EXPIRY_MINUTES);

    await this.otpRepository.deleteByUserId(user['_id']);
    await this.otpRepository.create({
      userID: user['_id'],
      oneTimePassword: otpCode,
      expiredAt: expiryDate,
    });

    await this.emailQueue.add('sendOtp', {
      email: user.email,
      otp: otpCode,
      fullName: user.fullName,
    });

    return { message: 'OTP sent to your email.' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const user = await this.userRepository.findByEmail(resetPasswordDto.email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const otpRecord = await this.otpRepository.findByUserIdAndCode(user['_id'], resetPasswordDto.otp);
    if (!otpRecord || otpRecord.expiredAt < new Date()) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    // Update password
    await this.userRepository.updateById(user['_id'], {
      password: resetPasswordDto.newPassword,
    });

    // Invalidate all refresh tokens
    await this.refreshTokenRepository.revokeAllByUserId(user['_id']);

    // Delete OTP
    await this.otpRepository.deleteByUserId(user['_id']);

    return { message: 'Password reset successfully' };
  }

  private async generateTokens(user: User) {
    const payload = { sub: user['_id'], email: user.email, role: user.role };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: AUTH_CONSTANTS.TOKEN_EXPIRY.ACCESS_TOKEN,
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: AUTH_CONSTANTS.TOKEN_EXPIRY.REFRESH_TOKEN,
      secret: this.configService.get('JWT_REFRESH_SECRET') || this.configService.get('JWT_SECRET'),
    });

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);

    await this.refreshTokenRepository.create({
      userId: user['_id'],
      token: refreshToken,
      expiresAt: expiryDate,
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user['_id'],
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    };
  }
}
