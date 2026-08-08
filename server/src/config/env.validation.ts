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
  MAIL_DISABLED: boolean;
  SMTP_HOST?: string;
  SMTP_PORT: number;
  SMTP_SECURE: boolean;
  SMTP_USER?: string;
  SMTP_PASSWORD?: string;
  SMTP_FROM?: string;
  MAIL_TEST_TO?: string;
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

const asBoolean = (
  value: string | undefined,
  key: string,
  fallback: boolean,
): boolean => {
  if (value === undefined || value.trim() === '') return fallback;
  if (value === 'true') return true;
  if (value === 'false') return false;
  throw new Error(`Environment variable ${key} must be true or false`);
};

export const validateEnvironment = (
  config: Record<string, string | undefined>,
): Environment => {
  const NODE_ENV = (config.NODE_ENV ??
    'development') as Environment['NODE_ENV'];
  if (!['development', 'test', 'production'].includes(NODE_ENV)) {
    throw new Error('NODE_ENV must be development, test, or production');
  }

  const MAIL_DISABLED = asBoolean(
    config.MAIL_DISABLED,
    'MAIL_DISABLED',
    NODE_ENV === 'test' || !optionalNonEmpty(config.SMTP_USER),
  );
  const SMTP_PORT = asNumber(config.SMTP_PORT, 'SMTP_PORT', 587);
  const SMTP_SECURE = asBoolean(
    config.SMTP_SECURE,
    'SMTP_SECURE',
    false,
  );
  const SMTP_HOST = optionalNonEmpty(config.SMTP_HOST);
  const SMTP_USER = optionalNonEmpty(config.SMTP_USER);
  const SMTP_PASSWORD = optionalNonEmpty(config.SMTP_PASSWORD);
  const SMTP_FROM = optionalNonEmpty(config.SMTP_FROM);

  if (!MAIL_DISABLED) {
    for (const [key, value] of Object.entries({
      SMTP_HOST,
      SMTP_USER,
      SMTP_PASSWORD,
      SMTP_FROM,
    })) {
      if (!value) throw new Error(`Missing required environment variable: ${key}`);
    }
    if (SMTP_PORT === 587 && SMTP_SECURE) {
      throw new Error('SMTP_SECURE must be false when SMTP_PORT is 587');
    }
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
    MAIL_DISABLED,
    SMTP_HOST,
    SMTP_PORT,
    SMTP_SECURE,
    SMTP_USER,
    SMTP_PASSWORD,
    SMTP_FROM,
    MAIL_TEST_TO: optionalNonEmpty(config.MAIL_TEST_TO),
  };
};
