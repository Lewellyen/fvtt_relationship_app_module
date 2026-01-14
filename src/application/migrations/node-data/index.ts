/**
 * Node data migration functions.
 *
 * MVP: Schema version 1 - no migrations needed yet.
 * This module provides the structure for future migrations.
 *
 * Migration functions should be named: migrateNodeV{From}ToV{To}
 * Example: migrateNodeV1ToV2, migrateNodeV2ToV3, etc.
 */

/**
 * Placeholder for future node data migrations.
 *
 * MVP: Schema version 1 is current, no migrations exist yet.
 * When schema version 2 is introduced, add migrateNodeV1ToV2 here.
 */
export const nodeDataMigrations: Array<{
  fromVersion: number;
  toVersion: number;
  migrate: (data: unknown) => Promise<unknown>;
}> = [];
