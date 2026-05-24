import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UserRepository } from '../../users/users.repository';
import { UserStatus } from '../../users/schema/users.schema';
import { isValidObjectId } from 'mongoose';
import { RoleRepository } from '../repositories/role.repository';
import { AUTH_CONSTANTS } from '../constants/auth.constants';

type AccessTokenPayload = {
  sub?: string;
  tokenUse?: string;
  jti?: string;
};

function getRequiredConfig(configService: ConfigService, key: string): string {
  const value = configService.get<string>(key);
  if (!value) {
    throw new Error(`${key} is required`);
  }
  return value;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly userRepository: UserRepository,
    private readonly roleRepository: RoleRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: getRequiredConfig(configService, 'JWT_SECRET'),
      issuer:
        configService.get<string>('JWT_ISSUER') || AUTH_CONSTANTS.JWT.ISSUER,
      audience:
        configService.get<string>('JWT_ACCESS_AUDIENCE') ||
        AUTH_CONSTANTS.JWT.AUDIENCE.ACCESS,
      algorithms: [AUTH_CONSTANTS.JWT.ALGORITHM],
    });
  }

  async validate(payload: AccessTokenPayload) {
    if (payload.tokenUse !== 'access' || !payload.jti) {
      throw new UnauthorizedException('Invalid access token');
    }

    if (!payload.sub || !isValidObjectId(payload.sub)) {
      throw new UnauthorizedException('Invalid access token');
    }

    const user = await this.userRepository.findByIdIncludingInactive(
      payload.sub,
    );
    if (!user || user.deletedAt || user.status === UserStatus.DELETED) {
      throw new UnauthorizedException('Account is not available');
    }

    if (
      user.isActive === false ||
      user.status === UserStatus.SUSPENDED ||
      !user.isEmailVerified
    ) {
      throw new UnauthorizedException('Account is not available');
    }

    const role = await this.roleRepository.findById(user.role);

    return {
      id: user._id.toString(),
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
      permissions: role?.permissions ?? [],
    };
  }
}
