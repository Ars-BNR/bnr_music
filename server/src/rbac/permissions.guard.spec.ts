import { ForbiddenException } from '@nestjs/common';
import { PermissionsGuard } from './permissions.guard';

describe('PermissionsGuard', () => {
  const createContext = (user: Record<string, unknown>) =>
    ({
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
    }) as never;

  it('allows admin even when a permission is absent from the principal list', () => {
    const guard = new PermissionsGuard({
      getAllAndOverride: jest.fn().mockReturnValue(['rbac.manage']),
    } as never);

    expect(
      guard.canActivate(
        createContext({ roles: ['admin'], permissions: [], sub: 1 }),
      ),
    ).toBe(true);
  });

  it('requires every declared permission from non-admin users', () => {
    const guard = new PermissionsGuard({
      getAllAndOverride: jest
        .fn()
        .mockReturnValue(['users.read', 'rbac.manage']),
    } as never);

    expect(() =>
      guard.canActivate(
        createContext({ roles: ['user'], permissions: ['users.read'], sub: 2 }),
      ),
    ).toThrow(ForbiddenException);
  });
});
