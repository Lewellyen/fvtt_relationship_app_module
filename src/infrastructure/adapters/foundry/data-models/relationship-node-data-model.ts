/**
 * Foundry DataModel for relationship node data.
 * Stub implementation for Phase 1 (full implementation in Phase 4).
 *
 * This DataModel extends foundry.abstract.TypeDataModel and defines the schema
 * for JournalEntryPage.system data when the page type is relationship_app_node.
 */

import type { RelationshipNodeData } from "@/domain/types/relationship-node-data.interface";
import { RELATIONSHIP_NODE_SCHEMA_VERSION } from "@/domain/types/relationship-node-data.interface";

type RelationshipNodeDataSchema = foundry.data.fields.DataSchema;
type RelationshipNodeBaseData = RelationshipNodeData & Record<string, unknown>;

/**
 * RelationshipNodeDataModel for JournalEntryPage system data.
 * Stub implementation - full implementation in Phase 4.
 */
export class RelationshipNodeDataModel extends foundry.abstract.TypeDataModel<
  RelationshipNodeDataSchema,
  foundry.documents.JournalEntryPage,
  RelationshipNodeBaseData,
  RelationshipNodeBaseData
> {
  static override defineSchema(): RelationshipNodeDataSchema {
    const fields = foundry.data.fields;
    return {
      schemaVersion: new fields.NumberField({
        required: true,
        integer: true,
        initial: RELATIONSHIP_NODE_SCHEMA_VERSION,
      }),
      nodeKey: new fields.StringField({ required: true, initial: "" }),
      name: new fields.StringField({ required: true, initial: "" }),
      kind: new fields.StringField({
        required: true,
        choices: ["person", "place", "object"],
        initial: "person",
      }),
      factionId: new fields.StringField({ required: false }),
      relation: new fields.StringField({
        required: true,
        choices: ["friend", "enemy", "neutral"],
        initial: "neutral",
      }),
      icon: new fields.StringField({ required: false }),
      descriptions: new fields.SchemaField({
        public: new fields.StringField({ required: false, blank: true, initial: "" }),
        hidden: new fields.StringField({ required: false, blank: true, initial: "" }),
        gm: new fields.StringField({ required: false, blank: true, initial: "" }),
      }),
      reveal: new fields.SchemaField({
        public: new fields.BooleanField({ required: true, initial: false }),
        hidden: new fields.BooleanField({ required: true, initial: false }),
      }),
      effects: new fields.SchemaField({
        friend: new fields.StringField({ required: false }),
        enemy: new fields.StringField({ required: false }),
        neutral: new fields.StringField({ required: false }),
      }),
      linkedEntityUuid: new fields.StringField({ required: false }),
    };
  }

  /**
   * Migration for future schema versions (Phase 3).
   * Currently returns data as-is for schema version 1.
   */
  static override migrateData(
    source: Partial<RelationshipNodeBaseData>
  ): Partial<RelationshipNodeBaseData> {
    // Phase 1: No migration needed (schema version 1)
    // Migration logic will be added in Phase 3
    return super.migrateData(source);
  }
}
