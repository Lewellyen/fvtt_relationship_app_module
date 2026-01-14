/**
 * Graph data migration functions.
 *
 * MVP: Schema version 1 - no migrations needed yet.
 * This module provides the structure for future migrations.
 *
 * Migration functions should be named: migrateGraphV{From}ToV{To}
 * Example: migrateGraphV1ToV2, migrateGraphV2ToV3, etc.
 */

/**
 * Placeholder for future graph data migrations.
 *
 * MVP: Schema version 1 is current, no migrations exist yet.
 * When schema version 2 is introduced, add migrateGraphV1ToV2 here.
 */
export const graphDataMigrations: Array<{
  fromVersion: number;
  toVersion: number;
  migrate: (data: unknown) => Promise<unknown>;
}> = [];
