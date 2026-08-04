import { TokenService } from './token.service';

describe('TokenService', () => {
  it('stores a bcrypt hash instead of the raw refresh token', async () => {
    const repository = {
      findAll: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue({ id: 1 }),
    };
    const service = new TokenService(
      { signAsync: jest.fn(), verifyAsync: jest.fn() } as any,
      { getOrThrow: jest.fn() } as any,
      { transaction: jest.fn() } as any,
      repository as any,
    );

    await service.saveToken(7, 'raw-refresh-token');
    const stored = repository.create.mock.calls[0][0].refreshToken;
    expect(stored).not.toBe('raw-refresh-token');
    expect(stored).toMatch(/^\$2[aby]\$/);
  });
});
