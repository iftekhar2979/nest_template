import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from 'src/users/users.module';
import { User } from 'src/users/schema/users.schema';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Otp } from './otp.schema';
import { RefreshToken } from './schema/refresh-token.schema';
import { Role } from './schema/role.schema';
import { EmailserviceModule } from 'src/emailservice/emailservice.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserRepository } from 'src/users/users.repository';
import { OtpRepository } from './repositories/otp.repository';
import { RefreshTokenRepository } from './repositories/refresh-token.repository';
import { RoleRepository } from './repositories/role.repository';
import { JwtStrategy } from './guard/jwt.strategy';
import { ThrottlerBehindProxyGuard } from '../shared/guards/throttler-behind-proxy.guard';
import { AUTH_CONSTANTS } from './constants/auth.constants';
import { AuthRateLimitGuard } from './guard/auth-rate-limit.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Otp, RefreshToken, Role]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret) {
          throw new Error('JWT_SECRET is required');
        }

        return {
          secret,
          signOptions: {
            issuer:
              configService.get<string>('JWT_ISSUER') ||
              AUTH_CONSTANTS.JWT.ISSUER,
            audience:
              configService.get<string>('JWT_ACCESS_AUDIENCE') ||
              AUTH_CONSTANTS.JWT.AUDIENCE.ACCESS,
            algorithm: AUTH_CONSTANTS.JWT.ALGORITHM,
            expiresIn:
              configService.get<string>('ACCESS_TOKEN_EXPIRY') ||
              AUTH_CONSTANTS.TOKEN_EXPIRY.ACCESS_TOKEN,
          },
        };
      },
      inject: [ConfigService],
    }),
    UsersModule,
    EmailserviceModule,
  ],
  providers: [
    AuthService,
    UserRepository,
    OtpRepository,
    RefreshTokenRepository,
    RoleRepository,
    JwtStrategy,
    ThrottlerBehindProxyGuard,
    AuthRateLimitGuard,
  ],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
