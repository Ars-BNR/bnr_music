export interface Environment {
  NODE_ENV: 'development' | 'test' | 'production';
  PORT: number;
  POSTGRES_HOST: string;
  POSTGRES_PORT: number;
  POSTGRES_USER: string;
  POSTGRES_PASSWORD: string;
  POSTGRES_DB: string;
  JWT_ACCESS_SECRET: string;
  JWT_REFRESH_SECRET: string;
  EXPIRES_ACCESS_JWT: string;
  EXPIRES_REFRESH_JWT: string;
  CLIENT_URL: string;
  API_URL: string;
  REFRESH_COOKIE_MAX_AGE: number;
  SEED_ADMIN_EMAIL?: string;
  SEED_ADMIN_PASSWORD?: string;
}

const required = (value: string | undefined, key: string): string => {
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
};

const asNumber = (
  value: string | undefined,
  key: string,
  fallback?: number,
): number => {
  const parsed = Number(value ?? fallback);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`Environment variable ${key} must be a positive number`);
  }
  return parsed;
};

const optionalNonEmpty = (value: string | undefined): string | undefined =>
  value?.trim() ? value : undefined;

export const validateEnvironment = (
  config: Record<string, string | undefined>,
): Environment => {
  const NODE_ENV = (config.NODE_ENV ??
    'development') as Environment['NODE_ENV'];
  if (!['development', 'test', 'production'].includes(NODE_ENV)) {
    throw new Error('NODE_ENV must be development, test, or production');
  }

  return {
    NODE_ENV,
    PORT: asNumber(config.PORT, 'PORT', 8341),
    POSTGRES_HOST: required(config.POSTGRES_HOST, 'POSTGRES_HOST'),
    POSTGRES_PORT: asNumber(config.POSTGRES_PORT, 'POSTGRES_PORT', 5432),
    POSTGRES_USER: required(config.POSTGRES_USER, 'POSTGRES_USER'),
    POSTGRES_PASSWORD: required(config.POSTGRES_PASSWORD, 'POSTGRES_PASSWORD'),
    POSTGRES_DB: required(config.POSTGRES_DB, 'POSTGRES_DB'),
    JWT_ACCESS_SECRET: required(config.JWT_ACCESS_SECRET, 'JWT_ACCESS_SECRET'),
    JWT_REFRESH_SECRET: required(
      config.JWT_REFRESH_SECRET,
      'JWT_REFRESH_SECRET',
    ),
    EXPIRES_ACCESS_JWT: config.EXPIRES_ACCESS_JWT ?? '15m',
    EXPIRES_REFRESH_JWT: config.EXPIRES_REFRESH_JWT ?? '30d',
    CLIENT_URL: required(config.CLIENT_URL, 'CLIENT_URL'),
    API_URL: required(config.API_URL, 'API_URL'),
    REFRESH_COOKIE_MAX_AGE: asNumber(
      config.REFRESH_COOKIE_MAX_AGE,
      'REFRESH_COOKIE_MAX_AGE',
      2592000000,
    ),
    SEED_ADMIN_EMAIL: optionalNonEmpty(config.SEED_ADMIN_EMAIL),
    SEED_ADMIN_PASSWORD: optionalNonEmpty(config.SEED_ADMIN_PASSWORD),
  };
};
