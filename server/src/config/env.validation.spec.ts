import { validateEnvironment } from './env.validation';

const baseEnvironment = (
  overrides: Record<string, string | undefined> = {},
): Record<string, string | undefined> => ({
  NODE_ENV: 'development',
  PORT: '8340',
  POSTGRES_HOST: 'localhost',
  POSTGRES_PORT: '5432',
  POSTGRES_USER: 'postgres',
  POSTGRES_PASSWORD: 'test-password',
  POSTGRES_DB: 'bnr_music_test',
  JWT_ACCESS_SECRET: 'access-secret',
  JWT_REFRESH_SECRET: 'refresh-secret',
  CLIENT_URL: 'http://localhost:3000',
  API_URL: 'http://localhost:8340',
  ...overrides,
});

describe('validateEnvironment', () => {
  it('preserves configured seed credentials without making them required', () => {
    const env = validateEnvironment(
      baseEnvironment({
        SEED_ADMIN_EMAIL: 'admin@example.test',
        SEED_ADMIN_PASSWORD: 'seed-password',
      }),
    );

    expect(env.SEED_ADMIN_EMAIL).toBe('admin@example.test');
    expect(env.SEED_ADMIN_PASSWORD).toBe('seed-password');
  });

  it('accepts regular server configuration without seed credentials', () => {
    const env = validateEnvironment(baseEnvironment());

    expect(env.SEED_ADMIN_EMAIL).toBeUndefined();
    expect(env.SEED_ADMIN_PASSWORD).toBeUndefined();
  });

  it('normalizes blank seed credentials to undefined', () => {
    const env = validateEnvironment(
      baseEnvironment({ SEED_ADMIN_EMAIL: '   ', SEED_ADMIN_PASSWORD: '' }),
    );

    expect(env.SEED_ADMIN_EMAIL).toBeUndefined();
    expect(env.SEED_ADMIN_PASSWORD).toBeUndefined();
  });
});
