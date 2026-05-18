export const AUTH_CONSTANTS = {
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
  },
  OTP: {
    EXPIRY_MINUTES: 5,
    LENGTH: 6,
  },
};
