import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from 'src/users/users.module';
import { User, UserSchema } from 'src/users/schema/users.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Otp, OtpSchema } from './otp.schema';
import { RefreshToken, RefreshTokenSchema } from './schema/refresh-token.schema';
import { EmailserviceModule } from 'src/emailservice/emailservice.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserRepository } from 'src/users/users.repository';
import { OtpRepository } from './repositories/otp.repository';
import { RefreshTokenRepository } from './repositories/refresh-token.repository';
import { JwtStrategy } from './guard/jwt.strategy';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Otp.name, schema: OtpSchema },
      { name: RefreshToken.name, schema: RefreshTokenSchema },
    ]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: configService.get<string>('ACCESS_TOKEN_EXPIRY') }, // Default access token expiry
      }),
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
    JwtStrategy,
  ],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule { }
