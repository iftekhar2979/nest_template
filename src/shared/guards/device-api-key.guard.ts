import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Authenticates device/biometric gateways posting punch events.
 * Expects an `x-device-api-key` header matching the DEVICE_API_KEY env var.
 */
@Injectable()
export class DeviceApiKeyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const configuredKey = this.configService.get<string>('DEVICE_API_KEY');
    if (!configuredKey) {
      throw new ServiceUnavailableException(
        'Device ingestion is not configured',
      );
    }

    const request = context.switchToHttp().getRequest();
    const providedKey =
      request.headers['x-device-api-key'] ?? request.headers['x-api-key'];

    if (!providedKey || providedKey !== configuredKey) {
      throw new UnauthorizedException('Invalid device API key');
    }

    return true;
  }
}
