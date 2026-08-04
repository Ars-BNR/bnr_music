import { QueryInterface } from 'sequelize';
import { MigrationParams } from 'umzug';
import { databaseTables } from '../models';

export const name = '0001-baseline';

export async function up({
  context,
}: MigrationParams<QueryInterface>): Promise<void> {
  const existing = (await context.showAllTables()).map((table) =>
    table.toLowerCase(),
  );
  const present = databaseTables.filter((table) => existing.includes(table));

  if (present.length === 0) {
    await context.sequelize.sync();
    return;
  }

  if (present.length !== databaseTables.length) {
    const missing = databaseTables.filter((table) => !existing.includes(table));
    throw new Error(
      `Database has a partial BNR Music schema. Missing tables: ${missing.join(', ')}. ` +
        'Restore it or start with a clean database before accepting the baseline.',
    );
  }
}

export async function down(): Promise<void> {
  throw new Error(
    'The baseline migration is intentionally irreversible. Restore a database backup instead.',
  );
}
