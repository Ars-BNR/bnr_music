import { DataTypes, QueryInterface, Sequelize } from 'sequelize';
import { MigrationParams } from 'umzug';

export const name = '0010-play-analytics';

async function hasTable(context: QueryInterface, table: string) {
  return (await context.showAllTables()).includes(table);
}

export async function up({ context }: MigrationParams<QueryInterface>) {
  const eventsExist = await hasTable(context, 'play_events');
  await context.sequelize.transaction(async (transaction) => {
    if (!eventsExist) {
      await context.createTable(
        'play_events',
        {
          id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
          },
          playbackId: {
            type: DataTypes.UUID,
            allowNull: false,
            unique: true,
          },
          trackId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'tracks', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          playedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
        },
        { transaction },
      );
    }
    await context.sequelize.query(
      'CREATE INDEX IF NOT EXISTS "play_events_played_track_idx" ON "play_events" ("playedAt", "trackId")',
      { transaction },
    );
    await context.sequelize.query(
      'CREATE INDEX IF NOT EXISTS "play_events_track_idx" ON "play_events" ("trackId")',
      { transaction },
    );
    await context.sequelize.query(
      `INSERT INTO "permissions" ("code", "name", "description", "createdAt", "updatedAt")
       VALUES ('analytics.read', 'Read analytics', 'View music analytics dashboard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       ON CONFLICT ("code") DO UPDATE SET "name" = EXCLUDED."name", "description" = EXCLUDED."description", "updatedAt" = CURRENT_TIMESTAMP`,
      { transaction },
    );
    await context.sequelize.query(
      `INSERT INTO "role_permissions" ("roleId", "permissionId")
       SELECT r.id, p.id FROM "roles" r CROSS JOIN "permissions" p
       WHERE r.code = 'admin' AND p.code = 'analytics.read'
       ON CONFLICT ("roleId", "permissionId") DO NOTHING`,
      { transaction },
    );
  });
}

export async function down({ context }: MigrationParams<QueryInterface>) {
  const eventsExist = await hasTable(context, 'play_events');
  await context.sequelize.transaction(async (transaction) => {
    await context.sequelize.query(
      `DELETE FROM "role_permissions" WHERE "permissionId" IN (SELECT id FROM "permissions" WHERE code = 'analytics.read')`,
      { transaction },
    );
    await context.sequelize.query(
      `DELETE FROM "permissions" WHERE code = 'analytics.read'`,
      { transaction },
    );
    if (eventsExist) await context.dropTable('play_events', { transaction });
  });
}
