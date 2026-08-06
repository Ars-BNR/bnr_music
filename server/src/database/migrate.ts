import { config as loadEnvironment } from 'dotenv';
import { Sequelize } from 'sequelize-typescript';
import { SequelizeStorage, Umzug } from 'umzug';
import { validateEnvironment } from 'src/config/env.validation';
import { databaseModels } from './models';
import * as baseline from './migrations/0001-baseline';
import * as hardening from './migrations/0002-security-and-constraints';
import * as userProfile from './migrations/0003-user-profile';
import * as creatorStudio from './migrations/0004-creator-studio';
import * as creatorStudioHardening from './migrations/0005-creator-studio-hardening';
import * as rbac from './migrations/0006-rbac';

loadEnvironment({ path: `.${process.env.NODE_ENV ?? 'development'}.env` });
const env = validateEnvironment(process.env);
const sequelize = new Sequelize({
  dialect: 'postgres',
  host: env.POSTGRES_HOST,
  port: env.POSTGRES_PORT,
  username: env.POSTGRES_USER,
  password: env.POSTGRES_PASSWORD,
  database: env.POSTGRES_DB,
  models: databaseModels,
  logging: false,
});

const umzug = new Umzug({
  migrations: [
    baseline,
    hardening,
    userProfile,
    creatorStudio,
    creatorStudioHardening,
    rbac,
  ],
  context: sequelize.getQueryInterface(),
  storage: new SequelizeStorage({ sequelize }),
  logger: console,
});

async function main(): Promise<void> {
  const command = process.argv[2] ?? 'up';
  try {
    if (command === 'up') await umzug.up();
    else if (command === 'down') await umzug.down({ step: 1 });
    else if (command === 'status') {
      const [executed, pending] = await Promise.all([
        umzug.executed(),
        umzug.pending(),
      ]);
      console.table([
        ...executed.map((migration) => ({
          name: migration.name,
          status: 'executed',
        })),
        ...pending.map((migration) => ({
          name: migration.name,
          status: 'pending',
        })),
      ]);
    } else throw new Error(`Unknown migration command: ${command}`);
  } finally {
    await sequelize.close();
  }
}

void main();
