import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { createHash } from 'crypto';
import Redis from 'ioredis';
import {
  AUTH_RATE_LIMIT_KEY,
  AuthRateLimitPolicy,
} from '../decorators/auth-rate-limit.decorator';

type RateLimitRule = {
  key: string;
  limit: number;
  ttlSeconds: number;
};

type RequestWithBody = {
  body?: Record<string, unknown>;
  ip?: string;
  ips?: string[];
  get?: (name: string) => string | undefined;
  headers?: Record<string, string | string[] | undefined>;
  user?: { sub?: string; id?: string };
};

@Injectable()
export class AuthRateLimitGuard implements CanActivate {
  private readonly logger = new Logger(AuthRateLimitGuard.name);
  private redis?: Redis;

  constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
  ) {}

  private getRedis(): Redis {
    if (this.redis) {
      return this.redis;
    }

    this.redis = new Redis({
      host:
        this.configService.get<string>('REDIS_HOST') ||
        process.env.REDIS_IP ||
        'localhost',
      port:
        this.configService.get<number>('REDIS_PORT') ||
        (process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : 6379),
      keyPrefix: 'auth_rl:',
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      retryStrategy: (times) => Math.min(times * 100, 1000),
    });

    this.redis.on('error', (error) => {
      this.logger.error(`Redis auth rate limiter error: ${error.message}`);
    });

    return this.redis;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const policy = this.reflector.getAllAndOverride<AuthRateLimitPolicy>(
      AUTH_RATE_LIMIT_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!policy) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithBody>();
    const rules = this.buildRules(policy, request);
    await this.enforce(rules);

    return true;
  }

  private async enforce(rules: RateLimitRule[]): Promise<void> {
    try {
      const redis = this.getRedis();
      const results = await Promise.all(
        rules.map(async (rule) => {
          const count = await redis.incr(rule.key);
          if (count === 1) {
            await redis.expire(rule.key, rule.ttlSeconds);
          }

          return { ...rule, count };
        }),
      );

      const blockedRule = results.find((result) => result.count > result.limit);
      if (blockedRule) {
        const retryAfter = await redis.ttl(blockedRule.key);
        throw new HttpException(
          {
            message:
              'Too many authentication attempts. Please try again later.',
            retryAfter: Math.max(retryAfter, 1),
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    } catch (error) {
      if (
        error instanceof HttpException &&
        error.getStatus() === HttpStatus.TOO_MANY_REQUESTS
      ) {
        throw error;
      }

      this.logger.error(
        `Auth rate limiter unavailable: ${(error as Error).message}`,
      );
      throw new ServiceUnavailableException(
        'Authentication protection is temporarily unavailable',
      );
    }
  }

  private buildRules(
    policy: AuthRateLimitPolicy,
    request: RequestWithBody,
  ): RateLimitRule[] {
    const ip = this.getClientIp(request);
    const email = this.getEmail(request);
    const tokenHash = this.getTokenHash(request);
    const userId = request.user?.sub ?? request.user?.id;

    const route = (limit: number, ttlSeconds: number): RateLimitRule => ({
      key: `${policy}:ip:${this.hash(ip)}`,
      limit,
      ttlSeconds,
    });

    switch (policy) {
      case 'register':
        return [
          route(8, 10 * 60),
          ...this.when(
            email,
            `${policy}:email:${this.hash(email)}`,
            3,
            60 * 60,
          ),
          ...this.when(
            email,
            `${policy}:ip-email:${this.hash(`${ip}:${email}`)}`,
            3,
            15 * 60,
          ),
        ];
      case 'login':
        return [
          route(20, 5 * 60),
          ...this.when(
            email,
            `${policy}:email:${this.hash(email)}`,
            5,
            15 * 60,
          ),
          ...this.when(
            email,
            `${policy}:ip-email:${this.hash(`${ip}:${email}`)}`,
            5,
            5 * 60,
          ),
        ];
      case 'verify-otp':
        return [
          route(15, 5 * 60),
          ...this.when(tokenHash, `${policy}:token:${tokenHash}`, 5, 5 * 60),
          ...this.when(
            tokenHash,
            `${policy}:ip-token:${this.hash(`${ip}:${tokenHash}`)}`,
            5,
            5 * 60,
          ),
        ];
      case 'forgot-password':
        return [
          route(5, 10 * 60),
          ...this.when(
            email,
            `${policy}:email:${this.hash(email)}`,
            3,
            60 * 60,
          ),
          ...this.when(
            email,
            `${policy}:ip-email:${this.hash(`${ip}:${email}`)}`,
            3,
            15 * 60,
          ),
        ];
      case 'reset-password':
        return [
          route(10, 10 * 60),
          ...this.when(tokenHash, `${policy}:token:${tokenHash}`, 5, 5 * 60),
        ];
      case 'refresh-token':
        return [
          route(60, 60),
          ...this.when(tokenHash, `${policy}:token:${tokenHash}`, 20, 5 * 60),
        ];
      case 'logout':
        return [
          route(60, 60),
          ...this.when(userId, `${policy}:user:${this.hash(userId)}`, 60, 60),
        ];
      case 'logout-all':
        return [
          route(20, 60),
          ...this.when(userId, `${policy}:user:${this.hash(userId)}`, 10, 60),
        ];
      default:
        return [route(10, 60)];
    }
  }

  private when(
    value: string | undefined,
    key: string,
    limit: number,
    ttlSeconds: number,
  ): RateLimitRule[] {
    if (!value) {
      return [];
    }

    return [{ key, limit, ttlSeconds }];
  }

  private getEmail(request: RequestWithBody): string | undefined {
    const value = request.body?.email;
    return typeof value === 'string' ? value.toLowerCase().trim() : undefined;
  }

  private getTokenHash(request: RequestWithBody): string | undefined {
    const token =
      this.getStringBodyValue(request, 'verificationToken') ||
      this.getStringBodyValue(request, 'resetToken') ||
      this.getStringBodyValue(request, 'refreshToken');

    return token ? this.hash(token) : undefined;
  }

  private getStringBodyValue(
    request: RequestWithBody,
    key: string,
  ): string | undefined {
    const value = request.body?.[key];
    return typeof value === 'string' ? value : undefined;
  }

  private getClientIp(request: RequestWithBody): string {
    const forwardedFor = request.get?.('x-forwarded-for');
    if (forwardedFor) {
      return forwardedFor.split(',')[0].trim();
    }

    return request.ips?.[0] || request.ip || 'unknown';
  }

  private hash(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }
}
