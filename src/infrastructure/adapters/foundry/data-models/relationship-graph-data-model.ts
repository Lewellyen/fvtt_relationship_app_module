/**
 * Foundry DataModel for relationship graph data.
 * Stub implementation for early phases; full logic will be added in later phases.
 */

import type {
  RelationshipGraphData,
  RelationshipGraphDataSchema,
} from "@/domain/types/relationship-graph-data.interface";
import { RELATIONSHIP_GRAPH_SCHEMA_VERSION } from "@/domain/types/relationship-graph-data.interface";

type RelationshipGraphBaseData = RelationshipGraphData & Record<string, unknown>;

export class RelationshipGraphDataModel extends foundry.abstract.TypeDataModel<
  RelationshipGraphDataSchema,
  foundry.documents.JournalEntryPage,
  RelationshipGraphBaseData,
  RelationshipGraphBaseData
> {
  static override defineSchema(): RelationshipGraphDataSchema {
    const fields = foundry.data.fields;

    const edgeField = new fields.SchemaField({
      id: new fields.StringField({ required: true }),
      source: new fields.StringField({ required: true }),
      target: new fields.StringField({ required: true }),
      knowledge: new fields.StringField({
        required: true,
        choices: ["public", "hidden", "secret"],
        initial: "public",
      }),
      label: new fields.StringField({ required: false }),
    });

    const layoutField = new fields.SchemaField({
      positions: new fields.ObjectField({ required: false }),
      zoom: new fields.NumberField({ required: false }),
      pan: new fields.SchemaField({
        x: new fields.NumberField({ required: false }),
        y: new fields.NumberField({ required: false }),
      }),
    });

    const lastVersionField = new fields.SchemaField({
      schemaVersion: new fields.NumberField({
        required: true,
        initial: RELATIONSHIP_GRAPH_SCHEMA_VERSION,
      }),
    });

    const schema = {
      schemaVersion: new fields.NumberField({
        required: true,
        integer: true,
        initial: RELATIONSHIP_GRAPH_SCHEMA_VERSION,
      }),
      graphKey: new fields.StringField({ required: true, initial: "" }),
      nodeKeys: new fields.ArrayField(new fields.StringField({ required: true, initial: "" }), {
        required: true,
      }),
      edges: new fields.ArrayField(edgeField, { required: true }),
      layout: layoutField,
      lastVersion: lastVersionField,
    };

    /* type-coverage:ignore-next-line -- Foundry schema structure: Schema object matches RelationshipGraphDataSchema interface structurally, but TypeScript cannot infer the exact type compatibility between runtime field instances and the interface definition */
    return schema as unknown as RelationshipGraphDataSchema;
  }

  static override migrateData(
    source: Partial<RelationshipGraphData>
  ): Partial<RelationshipGraphData> {
    // Phase 1: No migration logic yet
    return super.migrateData(source) as Partial<RelationshipGraphData>;
  }
}
