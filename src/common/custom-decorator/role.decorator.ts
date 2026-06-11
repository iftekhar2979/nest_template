import { SetMetadata } from '@nestjs/common';
import { RoleType } from '../../users/schema/users.schema';

export const ROLES_KEY = 'authz:roles';
export const PERMISSIONS_KEY = 'authz:permissions';

export const Roles = (...roles: RoleType[]) => SetMetadata(ROLES_KEY, roles);

export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
