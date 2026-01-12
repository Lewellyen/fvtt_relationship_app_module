/**
 * Valibot schema for RelationshipGraphData.
 * Validates data structure for relationship graph pages.
 *
 * Schema version 1 (MVP).
 */

import * as v from "valibot";
import type { RelationshipGraphData } from "@/domain/types/relationship-graph-data.interface";
import { RELATIONSHIP_GRAPH_SCHEMA_VERSION } from "@/domain/types/relationship-graph-data.interface";

/**
 * Schema for position coordinates.
 */
const positionSchema = v.object({
  x: v.number(),
  y: v.number(),
});

/**
 * Schema for pan coordinates.
 */
const panSchema = v.object({
  x: v.number(),
  y: v.number(),
});

/**
 * Schema for graph layout information.
 */
const graphLayoutSchema = v.optional(
  v.object({
    positions: v.optional(v.record(v.string(), positionSchema)),
    zoom: v.optional(v.number()),
    pan: v.optional(panSchema),
  })
);

/**
 * Schema for relationship edge.
 */
const relationshipEdgeSchema = v.object({
  id: v.string(),
  source: v.string(),
  target: v.string(),
  knowledge: v.picklist(["public", "hidden", "secret"]),
  label: v.optional(v.string()),
});

/**
 * Schema for backup structure (lastVersion).
 * This is a flexible object that can contain any previous version's data.
 */
const graphDataLastVersionSchema = v.optional(
  v.object({
    schemaVersion: v.number(),
  })
);

/**
 * Valibot schema for RelationshipGraphData.
 */
export const relationshipGraphDataSchema = v.object({
  schemaVersion: v.literal(RELATIONSHIP_GRAPH_SCHEMA_VERSION),
  graphKey: v.string(),
  nodeKeys: v.array(v.string()),
  edges: v.array(relationshipEdgeSchema),
  layout: graphLayoutSchema,
  lastVersion: graphDataLastVersionSchema,
});

/**
 * Type inference from schema.
 */
export type RelationshipGraphDataFromSchema = v.InferInput<typeof relationshipGraphDataSchema>;

/**
 * Validates and parses relationship graph data.
 *
 * @param data - Unknown data to validate
 * @returns Parsed and validated RelationshipGraphData
 * @throws Valibot error if validation fails
 */
export function parseRelationshipGraphData(data: unknown): RelationshipGraphData {
  // type-coverage:ignore-next-line
  return v.parse(relationshipGraphDataSchema, data) as RelationshipGraphData;
}

/**
 * Safely validates relationship graph data.
 *
 * @param data - Unknown data to validate
 * @returns Object with success flag and parsed data or issues
 */
export function safeParseRelationshipGraphData(
  data: unknown
): ReturnType<typeof v.safeParse<typeof relationshipGraphDataSchema>> {
  return v.safeParse(relationshipGraphDataSchema, data);
}
