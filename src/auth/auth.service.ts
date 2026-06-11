import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import * as argon2 from 'argon2';
import { createHash, randomInt, randomUUID } from 'crypto';
import { isUUID } from 'class-validator';
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
import { AUTH_CONSTANTS } from './constants/auth.constants';
import { RoleType, User, UserStatus } from '../users/schema/users.schema';
import { EMAIL_CONSTANTS } from '../emailservice/constants/email.constants';
import { RoleRepository } from './repositories/role.repository';
import { Role } from './schema/role.schema';

const PASSWORD_RESET_REQUEST_MESSAGE =
  'If an account exists, an OTP has been sent.';
const PASSWORD_RESET_RESULT_MESSAGE =
  'If the OTP is valid, your password has been reset.';
const MAX_STORED_USER_AGENT_LENGTH = 512;

type AuthRequestContext = {
  ip?: string;
  userAgent?: string;
};

type AuthJwtPayload = {
  sub: string;
  email: string;
  role: RoleType;
  permissions: string[];
  tokenUse: 'access' | 'refresh';
  jti: string;
};

type EmailVerificationJwtPayload = {
  sub: string;
  tokenUse: 'email_verification';
  jti: string;
};

type PasswordResetVerificationJwtPayload = {
  sub: string;
  tokenUse: 'password_reset_verification';
  jti: string;
};

type PasswordResetJwtPayload = {
  sub: string;
  tokenUse: 'password_reset';
  jti: string;
};

type OtpVerificationJwtPayload =
  | EmailVerificationJwtPayload
  | PasswordResetVerificationJwtPayload;

type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userRepository: UserRepository,
    private readonly otpRepository: OtpRepository,
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly roleRepository: RoleRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectQueue('EMAIL_QUEUE') private readonly emailQueue: Queue,
  ) {}

  async register(registerDto: RegisterDto) {
    try {
      if (!registerDto.isTcPpAccepted) {
        throw new BadRequestException(
          'Terms and privacy policy must be accepted',
        );
      }

      const email = this.normalizeEmail(registerDto.email);
      const existingUser =
        await this.userRepository.findByEmailIncludingInactive(email);
      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }

      const newUser = await this.userRepository.create({
        email,
        fullName: registerDto.fullName.trim(),
        phoneNumber: registerDto.phoneNumber,
        timezone: registerDto.timezone,
        passwordHash: registerDto.password,
        role: RoleType.CLIENT,
        isEmailVerified: false,
        isTcPpAccepted: true,
        status: UserStatus.ACTIVE,
      });

      await this.issueOtp(newUser);
      const verificationToken = await this.signEmailVerificationToken(newUser);

      return {
        message:
          'Registration successful. Please check your email for the OTP.',
        verificationToken,
      };
    } catch (error) {
      this.handleAuthError(error, 'register');
    }
  }

  async verifyOtp(verifyOtpDto: VerifyOtpDto, context?: AuthRequestContext) {
    const payload = this.verifyOtpVerificationToken(
      verifyOtpDto.verificationToken,
    );

    if (payload.tokenUse === 'email_verification') {
      return this.verifyEmailOtp(payload, verifyOtpDto.code, context);
    }

    return this.verifyPasswordResetOtp(payload, verifyOtpDto.code);
  }

  private async verifyEmailOtp(
    verificationPayload: EmailVerificationJwtPayload,
    code: string,
    context?: AuthRequestContext,
  ) {
    try {
      const user = await this.userRepository.findByIdIncludingInactive(
        this.normalizeUserId(verificationPayload.sub),
      );
      if (!user) {
        throw new UnauthorizedException('Invalid verification request');
      }

      const normalizedUserId = user.id;
      this.assertAccountCanAuthenticate(user);

      if (user.isEmailVerified) {
        await this.otpRepository.deleteByUserId(normalizedUserId);
        const role = await this.getRole(user.role);
        const tokens = await this.signTokens(user, role?.permissions ?? []);
        await this.storeRefreshToken(user, tokens.refreshToken, context);
        await this.userRepository.updateLastLoginAt(normalizedUserId);

        return this.buildAuthResponse(user, tokens, role);
      }

      await this.verifyOtpOrThrow(normalizedUserId, code);

      await this.userRepository.updateById(normalizedUserId, {
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
      });
      await this.otpRepository.deleteByUserId(normalizedUserId);

      user.isEmailVerified = true;
      user.emailVerifiedAt = new Date();

      const role = await this.getRole(user.role);
      const tokens = await this.signTokens(user, role?.permissions ?? []);
      await this.storeRefreshToken(user, tokens.refreshToken, context);
      await this.userRepository.updateLastLoginAt(normalizedUserId);

      return this.buildAuthResponse(user, tokens, role);
    } catch (error) {
      this.handleAuthError(error, 'verifyEmailOtp');
    }
  }

  async login(loginDto: LoginDto, context?: AuthRequestContext) {
    try {
      const email = this.normalizeEmail(loginDto.email);
      const user =
        await this.userRepository.findByEmailIncludingInactive(email);
      if (!user) {
        await this.runPasswordHashTimingPad(loginDto.password);
        throw new UnauthorizedException('Invalid credentials');
      }

      const isPasswordValid = await argon2.verify(
        user.passwordHash,
        loginDto.password,
      );
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }

      if (!this.canAccountAuthenticate(user)) {
        throw new UnauthorizedException('Invalid credentials');
      }

      if (!user.isEmailVerified) {
        await this.refreshTokenRepository.revokeAllByUserId(
          user.id,
        );
        await this.issueOtp(user);
        const verificationToken = await this.signEmailVerificationToken(user);

        return {
          message:
            'Please verify your email first. A new OTP has been sent to your email.',
          verificationToken,
        };
      }

      const role = await this.getRole(user.role);
      const tokens = await this.signTokens(user, role?.permissions ?? []);
      await this.storeRefreshToken(user, tokens.refreshToken, context);
      await this.userRepository.updateLastLoginAt(user.id);

      return this.buildAuthResponse(user, tokens, role);
    } catch (error) {
      this.handleAuthError(error, 'login');
    }
  }

  async refreshToken(
    refreshTokenDto: RefreshTokenDto,
    context?: AuthRequestContext,
  ) {
    try {
      const oldRefreshToken = refreshTokenDto.refreshToken;
      const payload = this.verifyRefreshToken(oldRefreshToken);
      const userId = this.normalizeUserId(payload.sub);
      const user = await this.userRepository.findByIdIncludingInactive(userId);

      if (!user) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      this.assertAccountCanAuthenticate(user);

      const role = await this.getRole(user.role);
      const tokens = await this.signTokens(user, role?.permissions ?? []);
      const oldTokenHash = this.hashToken(oldRefreshToken);
      const newTokenHash = this.hashToken(tokens.refreshToken);

      await this.storeRefreshToken(user, tokens.refreshToken, context);

      const consumedToken =
        await this.refreshTokenRepository.consumeActiveByTokenHash(
          oldTokenHash,
          newTokenHash,
        );

      if (
        !consumedToken ||
        consumedToken.userId.toString() !== user.id
      ) {
        await this.refreshTokenRepository.revokeAllByUserId(userId);
        throw new UnauthorizedException('Invalid or expired refresh token');
      }

      return this.buildAuthResponse(user, tokens, role);
    } catch (error) {
      this.handleAuthError(error, 'refreshToken');
    }
  }

  async logout(refreshToken: string, expectedUserId?: string) {
    try {
      const payload = this.verifyRefreshToken(refreshToken);
      if (expectedUserId && payload.sub !== expectedUserId.toString()) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const tokenHash = this.hashToken(refreshToken);
      const tokenRecord =
        await this.refreshTokenRepository.findByTokenHash(tokenHash);

      if (tokenRecord && tokenRecord.userId.toString() !== payload.sub) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      await this.refreshTokenRepository.revokeByTokenHash(tokenHash);
      return { message: 'Logged out successfully' };
    } catch (error) {
      this.handleAuthError(error, 'logout');
    }
  }

  async logoutAll(userId: string) {
    try {
      const normalizedUserId = this.normalizeUserId(userId);
      await this.refreshTokenRepository.revokeAllByUserId(normalizedUserId);
      return { message: 'Logged out from all devices' };
    } catch (error) {
      this.handleAuthError(error, 'logoutAll');
    }
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    try {
      const user = await this.userRepository.findByEmailIncludingInactive(
        this.normalizeEmail(forgotPasswordDto.email),
      );
      if (!user || !this.canAccountAuthenticate(user)) {
        return {
          message: PASSWORD_RESET_REQUEST_MESSAGE,
          verificationToken: await this.signPasswordResetVerificationToken(
            randomUUID(),
          ),
        };
      }

      await this.issueOtp(user);

      return {
        message: PASSWORD_RESET_REQUEST_MESSAGE,
        verificationToken: await this.signPasswordResetVerificationToken(
          user.id,
        ),
      };
    } catch (error) {
      this.handleAuthError(error, 'forgotPassword');
    }
  }

  private async verifyPasswordResetOtp(
    verificationPayload: PasswordResetVerificationJwtPayload,
    code: string,
  ) {
    try {
      const user = await this.userRepository.findByIdIncludingInactive(
        this.normalizeUserId(verificationPayload.sub),
      );
      if (!user || !this.canAccountAuthenticate(user)) {
        throw new BadRequestException('Invalid or expired OTP');
      }

      await this.verifyOtpOrThrow(user.id, code);
      await this.otpRepository.deleteByUserId(user.id);

      return {
        resetToken: await this.signPasswordResetToken(user),
      };
    } catch (error) {
      this.handleAuthError(error, 'verifyPasswordResetOtp');
    }
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    try {
      const payload = this.verifyPasswordResetToken(
        resetPasswordDto.resetToken,
      );
      const user = await this.userRepository.findByIdIncludingInactive(
        this.normalizeUserId(payload.sub),
      );
      if (!user || !this.canAccountAuthenticate(user)) {
        throw new UnauthorizedException('Invalid reset token');
      }

      await this.userRepository.updateById(user.id, {
        passwordHash: resetPasswordDto.newPassword,
      });
      await this.refreshTokenRepository.revokeAllByUserId(
        user.id,
      );
      await this.otpRepository.deleteByUserId(user.id);

      return { message: PASSWORD_RESET_RESULT_MESSAGE };
    } catch (error) {
      this.handleAuthError(error, 'resetPassword');
    }
  }

  private async issueOtp(user: User): Promise<void> {
    const otpCode = this.generateOtpCode(AUTH_CONSTANTS.OTP.LENGTH);
    const expiryDate = new Date(
      Date.now() + AUTH_CONSTANTS.OTP.EXPIRY_MINUTES * 60 * 1000,
    );
    const hashedOtp = await argon2.hash(otpCode);

    await this.otpRepository.upsertForUser({
      userID: user.id,
      oneTimePassword: hashedOtp,
      expiredAt: expiryDate,
    });

    await this.emailQueue.add(
      EMAIL_CONSTANTS.SEND_OTP,
      {
        email: user.email,
        otp: otpCode,
        fullName: user.fullName,
      },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: true,
        removeOnFail: 1000,
      },
    );
  }

  private async verifyOtpOrThrow(
    userId: string,
    code: string,
  ): Promise<void> {
    const otpRecord = await this.otpRepository.findByUserId(userId);
    if (!otpRecord) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    if (otpRecord.expiredAt < new Date()) {
      await this.otpRepository.deleteByUserId(userId);
      throw new BadRequestException('Invalid or expired OTP');
    }

    if (otpRecord.attempts >= AUTH_CONSTANTS.OTP.MAX_ATTEMPTS) {
      await this.otpRepository.deleteByUserId(userId);
      throw new BadRequestException(
        'Too many invalid OTP attempts. Request a new OTP.',
      );
    }

    let isOtpValid = false;
    try {
      isOtpValid = await argon2.verify(otpRecord.oneTimePassword, code);
    } catch {
      await this.otpRepository.deleteByUserId(userId);
      throw new BadRequestException('Invalid or expired OTP');
    }
    if (!isOtpValid) {
      await this.otpRepository.incrementAttempts(
        otpRecord.id,
      );
      throw new BadRequestException('Invalid or expired OTP');
    }
  }

  private async signTokens(
    user: User,
    permissions: string[],
  ): Promise<AuthTokens> {
    const basePayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      permissions,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { ...basePayload, tokenUse: 'access' },
        {
          jwtid: randomUUID(),
          secret: this.getAccessTokenSecret(),
          issuer: this.getJwtIssuer(),
          audience: this.getAccessTokenAudience(),
          algorithm: AUTH_CONSTANTS.JWT.ALGORITHM,
          expiresIn:
            this.configService.get<string>('ACCESS_TOKEN_EXPIRY') ||
            AUTH_CONSTANTS.TOKEN_EXPIRY.ACCESS_TOKEN,
        },
      ),
      this.jwtService.signAsync(
        { ...basePayload, tokenUse: 'refresh' },
        {
          jwtid: randomUUID(),
          issuer: this.getJwtIssuer(),
          audience: this.getRefreshTokenAudience(),
          algorithm: AUTH_CONSTANTS.JWT.ALGORITHM,
          expiresIn:
            this.configService.get<string>('REFRESH_TOKEN_EXPIRY') ||
            AUTH_CONSTANTS.TOKEN_EXPIRY.REFRESH_TOKEN,
          secret: this.getRefreshTokenSecret(),
        },
      ),
    ]);

    return { accessToken, refreshToken };
  }

  private async storeRefreshToken(
    user: User,
    refreshToken: string,
    context?: AuthRequestContext,
  ): Promise<void> {
    await this.refreshTokenRepository.create({
      userId: user.id,
      tokenHash: this.hashToken(refreshToken),
      expiresAt: this.getRefreshTokenExpiryDate(),
      createdByIp: context?.ip ?? '',
      userAgent: (context?.userAgent ?? '').slice(
        0,
        MAX_STORED_USER_AGENT_LENGTH,
      ),
    });
  }

  private buildAuthResponse(
    user: User,
    tokens: { accessToken: string; refreshToken: string },
    role: Role | null,
  ) {
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        permissions: role?.permissions ?? [],
        isEmailVerified: user.isEmailVerified,
      },
    };
  }

  private verifyRefreshToken(refreshToken: string): AuthJwtPayload {
    try {
      const payload = this.jwtService.verify<AuthJwtPayload>(refreshToken, {
        secret: this.getRefreshTokenSecret(),
        issuer: this.getJwtIssuer(),
        audience: this.getRefreshTokenAudience(),
        algorithms: [AUTH_CONSTANTS.JWT.ALGORITHM],
      });

      if (
        payload.tokenUse !== 'refresh' ||
        !payload.sub ||
        !payload.email ||
        !payload.jti
      ) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      return payload;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private async signEmailVerificationToken(user: User): Promise<string> {
    return this.jwtService.signAsync(
      {
        sub: user.id,
        tokenUse: 'email_verification',
      },
      {
        jwtid: randomUUID(),
        issuer: this.getJwtIssuer(),
        audience: this.getEmailVerificationTokenAudience(),
        algorithm: AUTH_CONSTANTS.JWT.ALGORITHM,
        expiresIn:
          this.configService.get<string>('EMAIL_VERIFICATION_TOKEN_EXPIRY') ||
          AUTH_CONSTANTS.TOKEN_EXPIRY.EMAIL_VERIFICATION_TOKEN,
        secret: this.getEmailVerificationTokenSecret(),
      },
    );
  }

  private verifyEmailVerificationToken(
    verificationToken: string,
  ): EmailVerificationJwtPayload {
    try {
      const payload = this.jwtService.verify<EmailVerificationJwtPayload>(
        verificationToken,
        {
          secret: this.getEmailVerificationTokenSecret(),
          issuer: this.getJwtIssuer(),
          audience: this.getEmailVerificationTokenAudience(),
          algorithms: [AUTH_CONSTANTS.JWT.ALGORITHM],
        },
      );

      if (
        payload.tokenUse !== 'email_verification' ||
        !payload.sub ||
        !payload.jti
      ) {
        throw new UnauthorizedException('Invalid verification token');
      }

      return payload;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid verification token');
    }
  }

  private async signPasswordResetVerificationToken(
    userId: string,
  ): Promise<string> {
    return this.jwtService.signAsync(
      {
        sub: userId,
        tokenUse: 'password_reset_verification',
      },
      {
        jwtid: randomUUID(),
        issuer: this.getJwtIssuer(),
        audience: this.getPasswordResetVerificationTokenAudience(),
        algorithm: AUTH_CONSTANTS.JWT.ALGORITHM,
        expiresIn:
          this.configService.get<string>(
            'PASSWORD_RESET_VERIFICATION_TOKEN_EXPIRY',
          ) || AUTH_CONSTANTS.TOKEN_EXPIRY.PASSWORD_RESET_VERIFICATION_TOKEN,
        secret: this.getPasswordResetVerificationTokenSecret(),
      },
    );
  }

  private verifyPasswordResetVerificationToken(
    verificationToken: string,
  ): PasswordResetVerificationJwtPayload {
    try {
      const payload =
        this.jwtService.verify<PasswordResetVerificationJwtPayload>(
          verificationToken,
          {
            secret: this.getPasswordResetVerificationTokenSecret(),
            issuer: this.getJwtIssuer(),
            audience: this.getPasswordResetVerificationTokenAudience(),
            algorithms: [AUTH_CONSTANTS.JWT.ALGORITHM],
          },
        );

      if (
        payload.tokenUse !== 'password_reset_verification' ||
        !payload.sub ||
        !payload.jti
      ) {
        throw new UnauthorizedException('Invalid verification token');
      }

      return payload;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid verification token');
    }
  }

  private verifyOtpVerificationToken(
    verificationToken: string,
  ): OtpVerificationJwtPayload {
    const decoded = this.jwtService.decode(verificationToken);
    if (!decoded || typeof decoded === 'string') {
      throw new UnauthorizedException('Invalid verification token');
    }

    const tokenUse = (decoded as { tokenUse?: string }).tokenUse;
    if (tokenUse === 'email_verification') {
      return this.verifyEmailVerificationToken(verificationToken);
    }

    if (tokenUse === 'password_reset_verification') {
      return this.verifyPasswordResetVerificationToken(verificationToken);
    }

    throw new UnauthorizedException('Invalid verification token');
  }

  private async signPasswordResetToken(user: User): Promise<string> {
    return this.jwtService.signAsync(
      {
        sub: user.id,
        tokenUse: 'password_reset',
      },
      {
        jwtid: randomUUID(),
        issuer: this.getJwtIssuer(),
        audience: this.getPasswordResetTokenAudience(),
        algorithm: AUTH_CONSTANTS.JWT.ALGORITHM,
        expiresIn:
          this.configService.get<string>('PASSWORD_RESET_TOKEN_EXPIRY') ||
          AUTH_CONSTANTS.TOKEN_EXPIRY.PASSWORD_RESET_TOKEN,
        secret: this.getPasswordResetTokenSecret(),
      },
    );
  }

  private verifyPasswordResetToken(
    resetToken: string,
  ): PasswordResetJwtPayload {
    try {
      const payload = this.jwtService.verify<PasswordResetJwtPayload>(
        resetToken,
        {
          secret: this.getPasswordResetTokenSecret(),
          issuer: this.getJwtIssuer(),
          audience: this.getPasswordResetTokenAudience(),
          algorithms: [AUTH_CONSTANTS.JWT.ALGORITHM],
        },
      );

      if (
        payload.tokenUse !== 'password_reset' ||
        !payload.sub ||
        !payload.jti
      ) {
        throw new UnauthorizedException('Invalid reset token');
      }

      return payload;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid reset token');
    }
  }

  private async getRole(roleId: RoleType): Promise<Role | null> {
    return this.roleRepository.findById(roleId);
  }

  private assertAccountCanAuthenticate(user: User): void {
    if (this.isDeletedAccount(user)) {
      throw new ForbiddenException('This account has been deleted');
    }

    if (!this.canAccountAuthenticate(user)) {
      throw new ForbiddenException('This account is suspended');
    }
  }

  private canAccountAuthenticate(user: User): boolean {
    return (
      !this.isDeletedAccount(user) &&
      user.isActive !== false &&
      user.status !== UserStatus.SUSPENDED
    );
  }

  private isDeletedAccount(user: User): boolean {
    return Boolean(user.deletedAt) || user.status === UserStatus.DELETED;
  }

  private normalizeEmail(email: string): string {
    return email.toLowerCase().trim();
  }

  private normalizeUserId(id: string): string {
    const value = id?.toString();
    if (!value || !isUUID(value)) {
      throw new BadRequestException('Invalid user id');
    }
    return value;
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private generateOtpCode(length = 6): string {
    return Array.from({ length }, () => randomInt(0, 10).toString()).join('');
  }

  private async runPasswordHashTimingPad(password: string): Promise<void> {
    await argon2.hash(password);
  }

  private getAccessTokenSecret(): string {
    const secret = this.configService.get<string>('JWT_SECRET');

    if (!secret) {
      this.logger.error('JWT access secret is not configured');
      throw new InternalServerErrorException(
        'Authentication service is not configured',
      );
    }

    return secret;
  }

  private getRefreshTokenSecret(): string {
    const secret =
      this.configService.get<string>('JWT_REFRESH_SECRET') ||
      this.configService.get<string>('JWT_SECRET');

    if (!secret) {
      this.logger.error('JWT refresh secret is not configured');
      throw new InternalServerErrorException(
        'Authentication service is not configured',
      );
    }

    return secret;
  }

  private getJwtIssuer(): string {
    return (
      this.configService.get<string>('JWT_ISSUER') || AUTH_CONSTANTS.JWT.ISSUER
    );
  }

  private getAccessTokenAudience(): string {
    return (
      this.configService.get<string>('JWT_ACCESS_AUDIENCE') ||
      AUTH_CONSTANTS.JWT.AUDIENCE.ACCESS
    );
  }

  private getRefreshTokenAudience(): string {
    return (
      this.configService.get<string>('JWT_REFRESH_AUDIENCE') ||
      AUTH_CONSTANTS.JWT.AUDIENCE.REFRESH
    );
  }

  private getEmailVerificationTokenAudience(): string {
    return (
      this.configService.get<string>('JWT_EMAIL_VERIFICATION_AUDIENCE') ||
      AUTH_CONSTANTS.JWT.AUDIENCE.EMAIL_VERIFICATION
    );
  }

  private getPasswordResetVerificationTokenAudience(): string {
    return (
      this.configService.get<string>(
        'JWT_PASSWORD_RESET_VERIFICATION_AUDIENCE',
      ) || AUTH_CONSTANTS.JWT.AUDIENCE.PASSWORD_RESET_VERIFICATION
    );
  }

  private getPasswordResetTokenAudience(): string {
    return (
      this.configService.get<string>('JWT_PASSWORD_RESET_AUDIENCE') ||
      AUTH_CONSTANTS.JWT.AUDIENCE.PASSWORD_RESET
    );
  }

  private getEmailVerificationTokenSecret(): string {
    const secret =
      this.configService.get<string>('JWT_EMAIL_VERIFICATION_SECRET') ||
      this.configService.get<string>('JWT_SECRET');

    if (!secret) {
      this.logger.error('JWT email verification secret is not configured');
      throw new InternalServerErrorException(
        'Authentication service is not configured',
      );
    }

    return secret;
  }

  private getPasswordResetVerificationTokenSecret(): string {
    const secret =
      this.configService.get<string>(
        'JWT_PASSWORD_RESET_VERIFICATION_SECRET',
      ) || this.configService.get<string>('JWT_SECRET');

    if (!secret) {
      this.logger.error(
        'JWT password reset verification secret is not configured',
      );
      throw new InternalServerErrorException(
        'Authentication service is not configured',
      );
    }

    return secret;
  }

  private getPasswordResetTokenSecret(): string {
    const secret =
      this.configService.get<string>('JWT_PASSWORD_RESET_SECRET') ||
      this.configService.get<string>('JWT_SECRET');

    if (!secret) {
      this.logger.error('JWT password reset secret is not configured');
      throw new InternalServerErrorException(
        'Authentication service is not configured',
      );
    }

    return secret;
  }

  private getRefreshTokenExpiryDate(): Date {
    const expiresIn =
      this.configService.get<string>('REFRESH_TOKEN_EXPIRY') ||
      AUTH_CONSTANTS.TOKEN_EXPIRY.REFRESH_TOKEN;
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

  private handleAuthError(error: unknown, operation: string): never {
    if (error instanceof HttpException) {
      throw error;
    }

    const dbError = error as {
      code?: string;
      name?: string;
      message?: string;
      stack?: string;
    };

    this.logger.error(
      `Auth ${operation} failed: ${dbError?.name ?? 'UnknownError'} - ${dbError?.message ?? 'No message'}`,
      dbError?.stack,
    );

    // MySQL unique violation (ER_DUP_ENTRY / errno 1062)
    if (dbError?.code === 'ER_DUP_ENTRY') {
      if (dbError.message?.toLowerCase().includes('email')) {
        throw new ConflictException('User with this email already exists');
      }
      throw new ConflictException('Duplicate authentication resource');
    }

    // MySQL connection / availability errors
    if (
      [
        'ECONNREFUSED',
        'ETIMEDOUT',
        'PROTOCOL_CONNECTION_LOST',
        'ER_CON_COUNT_ERROR',
      ].includes(dbError?.code)
    ) {
      throw new ServiceUnavailableException(
        'Authentication service is temporarily unavailable',
      );
    }

    throw new InternalServerErrorException('Authentication request failed');
  }
}
