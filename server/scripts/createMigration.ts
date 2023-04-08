/**
 * This file was used to generate the initial_migration.  It does not work for subsequent ones.
 */

import { SequelizeTypescriptMigration } from 'sequelize-typescript-migration';

import { getDb, initDb } from '../src/db';
import path from 'path';

async function main() {
  const migrationName = process.argv[2];
  if (!migrationName) {
    console.error('No migration name, specify migration name in command');
    console.error(' `yarn create-migration <migrationName>`');
    return;
  }

  await initDb();

  await SequelizeTypescriptMigration.makeMigration(getDb().sequelize as any, {
    outDir: path.join(__dirname, '../src/migrations'),
    migrationName,
    preview: false,
  });
}

main();
