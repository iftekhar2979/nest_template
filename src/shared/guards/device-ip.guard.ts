import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Restricts device-ingestion routes to trusted source IPs (the ZKTeco push
 * bridge). The device never reaches Nest directly — only the bridge does —
 * so allowlisting the bridge's IP is enough.
 *
 * Configured via DEVICE_ALLOWED_IPS (comma-separated). When unset, only
 * localhost is allowed (bridge co-located with Nest).
 */
@Injectable()
export class DeviceIpGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const sourceIp = this.normalize(
      request.ip ?? request.socket?.remoteAddress ?? '',
    );

    if (!this.allowList().includes(sourceIp)) {
      throw new ForbiddenException(`Punch ingestion not allowed from ${sourceIp}`);
    }
    return true;
  }

  private allowList(): string[] {
    const configured = this.configService.get<string>('DEVICE_ALLOWED_IPS');
    const ips = (configured ?? '127.0.0.1')
      .split(',')
      .map((ip) => this.normalize(ip.trim()))
      .filter(Boolean);
    // localhost always resolves here whether it arrives as IPv4 or IPv6
    if (!ips.includes('127.0.0.1')) {
      ips.push('127.0.0.1');
    }
    return ips;
  }

  // Strip the IPv4-mapped-IPv6 prefix and treat ::1 as 127.0.0.1.
  private normalize(ip: string): string {
    if (ip === '::1') return '127.0.0.1';
    return ip.startsWith('::ffff:') ? ip.slice('::ffff:'.length) : ip;
  }
}
