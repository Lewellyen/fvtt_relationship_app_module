/**
 * Foundry DataModel for relationship node data.
 * Stub implementation for Phase 1 (full implementation in Phase 4).
 *
 * This DataModel extends foundry.abstract.TypeDataModel and defines the schema
 * for JournalEntryPage.system data when the page type is relationship_app_node.
 */

import type { RelationshipNodeData } from "@/domain/types/relationship-node-data.interface";
import { RELATIONSHIP_NODE_SCHEMA_VERSION } from "@/domain/types/relationship-node-data.interface";

type RelationshipNodeBaseData = RelationshipNodeData & Record<string, unknown>;

type NodeDescriptionsField = foundry.data.fields.SchemaField<{
  public: foundry.data.fields.StringField;
  hidden: foundry.data.fields.StringField;
  gm: foundry.data.fields.StringField;
}>;

type NodeRevealField = foundry.data.fields.SchemaField<{
  public: foundry.data.fields.BooleanField;
  hidden: foundry.data.fields.BooleanField;
}>;

type NodeEffectsField = foundry.data.fields.SchemaField<{
  friend: foundry.data.fields.StringField;
  enemy: foundry.data.fields.StringField;
  neutral: foundry.data.fields.StringField;
}>;

type NodeLastVersionField = foundry.data.fields.SchemaField<{
  schemaVersion: foundry.data.fields.NumberField;
}>;

/**
 * Foundry DataSchema interface for RelationshipNodeDataModel.
 *
 * Kept in Infrastructure to avoid leaking `foundry.*` types into Domain.
 */
interface RelationshipNodeDataSchema extends foundry.data.fields.DataSchema {
  schemaVersion: foundry.data.fields.NumberField;
  nodeKey: foundry.data.fields.StringField;
  name: foundry.data.fields.StringField;
  kind: foundry.data.fields.StringField;
  factionId: foundry.data.fields.StringField;
  relation: foundry.data.fields.StringField;
  icon: foundry.data.fields.StringField;
  descriptions: NodeDescriptionsField;
  reveal: NodeRevealField;
  effects: NodeEffectsField;
  linkedEntityUuid: foundry.data.fields.StringField;
  lastVersion: NodeLastVersionField;
}

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

    const lastVersionField = new fields.SchemaField({
      schemaVersion: new fields.NumberField({
        required: true,
        initial: RELATIONSHIP_NODE_SCHEMA_VERSION,
      }),
    });

    const schema = {
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
      lastVersion: lastVersionField,
    };

    /* type-coverage:ignore-next-line -- Foundry schema structure: Schema object matches RelationshipNodeDataSchema interface structurally, but TypeScript cannot infer the exact type compatibility between runtime field instances and the interface definition */
    return schema as unknown as RelationshipNodeDataSchema;
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
