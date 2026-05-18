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
import { Role, RoleSchema } from './schema/role.schema';
import { EmailserviceModule } from 'src/emailservice/emailservice.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserRepository } from 'src/users/users.repository';
import { OtpRepository } from './repositories/otp.repository';
import { RefreshTokenRepository } from './repositories/refresh-token.repository';
import { RoleRepository } from './repositories/role.repository';
import { JwtStrategy } from './guard/jwt.strategy';
import { Client, ClientSchema } from '../clients/schema/clients.schema';
import { ClientRepository } from '../clients/clients.repository';
import { ThrottlerBehindProxyGuard } from '../shared/guards/throttler-behind-proxy.guard';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Otp.name, schema: OtpSchema },
      { name: RefreshToken.name, schema: RefreshTokenSchema },
      { name: Role.name, schema: RoleSchema },
      { name: Client.name, schema: ClientSchema },
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
    RoleRepository,
    ClientRepository,
    JwtStrategy,
    ThrottlerBehindProxyGuard,
  ],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule { }
