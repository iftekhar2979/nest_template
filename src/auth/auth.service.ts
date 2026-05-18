import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import * as argon2 from 'argon2';
import { createHash, randomUUID } from 'crypto';
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
import { RoleType, User, UserStatus } from '../users/schema/users.schema';
import { Types } from 'mongoose';
import { EMAIL_CONSTANTS } from '../emailservice/constants/email.constants';
import { RoleRepository } from './repositories/role.repository';
import { ClientRepository } from '../clients/clients.repository';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly otpRepository: OtpRepository,
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly roleRepository: RoleRepository,
    private readonly clientRepository: ClientRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectQueue('EMAIL_QUEUE') private readonly emailQueue: Queue,
  ) { }

  async register(registerDto: RegisterDto) {
    const email = registerDto.email.toLowerCase().trim();
    const existingUser = await this.userRepository.findByEmailIncludingInactive(email);
    if (existingUser) {
      throw new BadRequestException('User with this email already exists!');
    }

    const newUser = await this.userRepository.create({
      email,
      fullName: registerDto.fullName.trim(),
      phoneNumber: registerDto.phoneNumber,
      timezone: registerDto.timezone,
      passwordHash: registerDto.password,
      role: RoleType.CLIENT,
      isEmailVerified: false,
      isTcPpAccepted: registerDto.isTcPpAccepted,
      status: UserStatus.ACTIVE,
    });

    await this.clientRepository.createForUser({
      userId: newUser._id as Types.ObjectId,
      companyName: registerDto.companyName,
      phone: registerDto.phoneNumber,
    });

    const otpCode = generateOtp();
    const expiryDate = new Date();
    expiryDate.setMinutes(expiryDate.getMinutes() + AUTH_CONSTANTS.OTP.EXPIRY_MINUTES);

    await this.otpRepository.create({
      userID: newUser['_id'],
      oneTimePassword: otpCode,
      expiredAt: expiryDate,
    });

    await this.emailQueue.add(EMAIL_CONSTANTS.SEND_OTP, {
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

    await this.userRepository.updateById(userId, {
      isEmailVerified: true,
      emailVerifiedAt: new Date(),
    });

    await this.otpRepository.deleteByUserId(userId);

    return { message: 'Email verified successfully' };
  }

  async login(loginDto: LoginDto, context?: { ip?: string; userAgent?: string }) {
    const user = await this.userRepository.findByEmailIncludingInactive(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    this.assertAccountCanAuthenticate(user);

    const isPasswordValid = await argon2.verify(user.passwordHash, loginDto.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isEmailVerified) {
      await this.refreshTokenRepository.revokeAllByUserId(user['_id']);

      const otpCode = generateOtp();
      const expiryDate = new Date();
      expiryDate.setMinutes(expiryDate.getMinutes() + AUTH_CONSTANTS.OTP.EXPIRY_MINUTES);

      await this.otpRepository.deleteByUserId(user['_id']);
      await this.otpRepository.create({
        userID: user['_id'],
        oneTimePassword: otpCode,
        expiredAt: expiryDate,
      });

      await this.emailQueue.add(EMAIL_CONSTANTS.SEND_OTP, {
        email: user.email,
        otp: otpCode,
        fullName: user.fullName,
      });

      throw new ForbiddenException('Please verify your email first. A new OTP has been sent to your email.');
    }

    await this.userRepository.updateLastLoginAt(user['_id']);

    return this.generateTokens(user, context);
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto, context?: { ip?: string; userAgent?: string }) {
    const { refreshToken } = refreshTokenDto;

    let payload;
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET') || this.configService.get('JWT_SECRET'),
      });
    } catch (e) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokenHash = this.hashToken(refreshToken);
    const tokenRecord = await this.refreshTokenRepository.findByTokenHash(tokenHash);
    if (!tokenRecord || tokenRecord.isRevoked || tokenRecord.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.userRepository.findByIdIncludingInactive(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    this.assertAccountCanAuthenticate(user);

    const tokens = await this.generateTokens(user, context);
    await this.refreshTokenRepository.revokeByTokenHash(
      tokenHash,
      this.hashToken(tokens.refreshToken),
    );

    return tokens;
  }

  async logout(refreshToken: string) {
    await this.refreshTokenRepository.revokeByTokenHash(this.hashToken(refreshToken));
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

    await this.emailQueue.add(EMAIL_CONSTANTS.SEND_OTP, {
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

    await this.userRepository.updateById(user['_id'], {
      passwordHash: resetPasswordDto.newPassword,
    });

    await this.refreshTokenRepository.revokeAllByUserId(user['_id']);

    await this.otpRepository.deleteByUserId(user['_id']);

    return { message: 'Password reset successfully' };
  }

  private async generateTokens(user: User, context?: { ip?: string; userAgent?: string }) {
    const role = await this.roleRepository.findById(user.role);
    const payload = {
      sub: user['_id'].toString(),
      email: user.email,
      role: user.role,
      permissions: role?.permissions ?? [],
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get<string>('ACCESS_TOKEN_EXPIRY') || AUTH_CONSTANTS.TOKEN_EXPIRY.ACCESS_TOKEN,
    });

    const refreshToken = this.jwtService.sign(payload, {
      jwtid: randomUUID(),
      expiresIn: this.configService.get<string>('REFRESH_TOKEN_EXPIRY') || AUTH_CONSTANTS.TOKEN_EXPIRY.REFRESH_TOKEN,
      secret: this.configService.get('JWT_REFRESH_SECRET') || this.configService.get('JWT_SECRET'),
    });

    await this.refreshTokenRepository.create({
      userId: user['_id'],
      tokenHash: this.hashToken(refreshToken),
      expiresAt: this.getRefreshTokenExpiryDate(),
      createdByIp: context?.ip ?? '',
      userAgent: context?.userAgent ?? '',
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user['_id'],
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        permissions: role?.permissions ?? [],
        isEmailVerified: user.isEmailVerified,
      },
    };
  }

  private assertAccountCanAuthenticate(user: User): void {
    if (user.deletedAt || user.status === UserStatus.DELETED) {
      throw new ForbiddenException('This account has been deleted');
    }

    if (!user.isActive || user.status === UserStatus.SUSPENDED) {
      throw new ForbiddenException('This account is suspended');
    }
  }

  private hashToken(token: string): string {
    return createHash('sha256')
      .update(token)
      .digest('hex');
  }

  private getRefreshTokenExpiryDate(): Date {
    const expiresIn = this.configService.get<string>('REFRESH_TOKEN_EXPIRY') || AUTH_CONSTANTS.TOKEN_EXPIRY.REFRESH_TOKEN;
    const match = expiresIn.match(/^(\d+)([smhd])$/);

    if (!match) {
      const fallback = new Date();
      fallback.setDate(fallback.getDate() + 30);
      return fallback;
    }

    const amount = Number(match[1]);
    const unit = match[2];
    const multiplier = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    }[unit];

    return new Date(Date.now() + amount * multiplier);
  }
}
