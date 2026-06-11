import { SetMetadata } from '@nestjs/common';

export const AUTH_RATE_LIMIT_KEY = 'auth:rate-limit-policy';

export type AuthRateLimitPolicy =
  | 'register'
  | 'login'
  | 'verify-otp'
  | 'forgot-password'
  | 'reset-password'
  | 'refresh-token'
  | 'logout'
  | 'logout-all';

export const AuthRateLimit = (policy: AuthRateLimitPolicy) =>
  SetMetadata(AUTH_RATE_LIMIT_KEY, policy);
