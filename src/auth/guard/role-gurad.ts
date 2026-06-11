import {
  Injectable,
  ExecutionContext,
  ForbiddenException,
  CanActivate,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  PERMISSIONS_KEY,
  ROLES_KEY,
} from '../../common/custom-decorator/role.decorator';
import { RoleType } from '../../users/schema/users.schema';

type AuthenticatedUser = {
  role?: RoleType;
  permissions?: string[];
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const roles = this.reflector.getAllAndOverride<RoleType[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!roles?.length && !requiredPermissions?.length) {
      throw new ForbiddenException('Access policy is not configured');
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser | undefined;
    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    if (roles?.length && (!user.role || !roles.includes(user.role))) {
      throw new ForbiddenException('Insufficient role');
    }

    if (
      requiredPermissions?.length &&
      !this.hasPermissions(user.permissions ?? [], requiredPermissions)
    ) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }

  private hasPermissions(
    userPermissions: string[],
    requiredPermissions: string[],
  ): boolean {
    if (userPermissions.includes('*')) {
      return true;
    }

    return requiredPermissions.every((requiredPermission) =>
      userPermissions.some((userPermission) =>
        this.permissionMatches(userPermission, requiredPermission),
      ),
    );
  }

  private permissionMatches(
    userPermission: string,
    requiredPermission: string,
  ): boolean {
    if (userPermission === requiredPermission) {
      return true;
    }

    if (!userPermission.endsWith(':*')) {
      return false;
    }

    return requiredPermission.startsWith(userPermission.slice(0, -1));
  }
}
