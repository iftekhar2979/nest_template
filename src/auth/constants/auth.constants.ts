export const AUTH_CONSTANTS = {
  JWT: {
    ISSUER: 'ilmifytech-api',
    ALGORITHM: 'HS256' as const,
    AUDIENCE: {
      ACCESS: 'ilmifytech-api:access',
      REFRESH: 'ilmifytech-api:refresh',
      EMAIL_VERIFICATION: 'ilmifytech-api:email-verification',
    },
  },
  ROLES: {
    SUPERADMIN: 'superadmin',
    ADMIN: 'admin',
    HTO: 'hto',
    SALES_LEADER: 'sales_leader',
    SALES_TEAM_LEADER: 'sales_team_leader',
    SALES_MEMBER: 'sales_member',
    OPERATION_LEADER: 'operation_leader',
    OPERATION_MEMBER: 'operation_member',
    CLIENT: 'client',
  },
  TOKEN_EXPIRY: {
    ACCESS_TOKEN: '15m',
    REFRESH_TOKEN: '30d',
    EMAIL_VERIFICATION_TOKEN: '10m',
  },
  OTP: {
    EXPIRY_MINUTES: 5,
    LENGTH: 6,
    MAX_ATTEMPTS: 5,
  },
};
