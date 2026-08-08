import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from './permissions.decorator';
import { AuthenticatedPrincipal, PermissionCode } from './rbac.constants';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<PermissionCode[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required?.length) return true;

    const user = context.switchToHttp().getRequest().user as
      | AuthenticatedPrincipal
      | undefined;
    if (user?.mustChangePassword) {
      const request = context
        .switchToHttp()
        .getRequest<{ route?: { path?: string } }>();
      const path = request.route?.path ?? '';
      const allowed = new Set(['/users/me', '/users/me/change-password']);
      if (!allowed.has(path)) {
        throw new ForbiddenException('PASSWORD_CHANGE_REQUIRED');
      }
    }
    if (
      !user ||
      (!user.roles.includes('admin') &&
        !required.every((permission) => user.permissions.includes(permission)))
    ) {
      throw new ForbiddenException('Insufficient permissions');
    }
    return true;
  }
}
