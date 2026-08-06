import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  it('ignores legacy role claims and resolves current access from the database', async () => {
    const principal = {
      sub: 4,
      email: 'saint@example.test',
      roles: ['user'],
      permissions: ['profile.manage-own'],
    };
    const rbacService = {
      resolvePrincipal: jest.fn().mockResolvedValue(principal),
    };
    const strategy = new JwtStrategy(
      { getOrThrow: jest.fn().mockReturnValue('test-secret') } as never,
      rbacService as never,
    );

    await expect(
      strategy.validate({
        sub: 4,
        email: 'saint@example.test',
        role: 'admin',
      } as never),
    ).resolves.toEqual(principal);
    expect(rbacService.resolvePrincipal).toHaveBeenCalledWith(4);
  });
});
