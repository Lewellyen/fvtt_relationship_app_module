/**
 * Valibot schema for RelationshipNodeData.
 * Validates data structure for relationship node pages.
 *
 * Schema version 1 (MVP).
 */

import * as v from "valibot";
import type { RelationshipNodeData } from "@/domain/types/relationship-node-data.interface";
import { RELATIONSHIP_NODE_SCHEMA_VERSION } from "@/domain/types/relationship-node-data.interface";
import { parseWithSchema } from "@/domain/utils/json-parser";

/**
 * Schema for node reveal visibility settings.
 */
const nodeRevealSchema = v.object({
  public: v.boolean(),
  hidden: v.boolean(),
});

/**
 * Schema for node descriptions with visibility levels.
 */
const nodeDescriptionsSchema = v.object({
  public: v.optional(v.string()),
  hidden: v.optional(v.string()),
  gm: v.optional(v.string()),
});

/**
 * Schema for node effects based on relation type.
 */
const nodeEffectsSchema = v.optional(
  v.object({
    friend: v.optional(v.string()),
    enemy: v.optional(v.string()),
    neutral: v.optional(v.string()),
  })
);

/**
 * Schema for backup structure (lastVersion).
 * This is a flexible object that can contain any previous version's data.
 */
const nodeDataLastVersionSchema = v.optional(
  v.object({
    schemaVersion: v.number(),
  })
);

/**
 * Valibot schema for RelationshipNodeData.
 */
export const relationshipNodeDataSchema = v.object({
  schemaVersion: v.literal(RELATIONSHIP_NODE_SCHEMA_VERSION),
  nodeKey: v.string(),
  name: v.string(),
  kind: v.picklist(["person", "place", "object"]),
  factionId: v.optional(v.string()),
  relation: v.picklist(["friend", "enemy", "neutral"]),
  icon: v.optional(v.string()),
  descriptions: nodeDescriptionsSchema,
  reveal: nodeRevealSchema,
  effects: nodeEffectsSchema,
  linkedEntityUuid: v.optional(v.string()),
  lastVersion: nodeDataLastVersionSchema,
});

/**
 * Type inference from schema.
 */
export type RelationshipNodeDataFromSchema = v.InferInput<typeof relationshipNodeDataSchema>;

/**
 * Validates and parses relationship node data.
 *
 * @param data - Unknown data to validate
 * @returns Parsed and validated RelationshipNodeData
 * @throws Valibot error if validation fails
 */
export function parseRelationshipNodeData(data: unknown): RelationshipNodeData {
  return parseWithSchema(relationshipNodeDataSchema, data);
}

/**
 * Safely validates relationship node data.
 *
 * @param data - Unknown data to validate
 * @returns Object with success flag and parsed data or issues
 */
export function safeParseRelationshipNodeData(
  data: unknown
): ReturnType<typeof v.safeParse<typeof relationshipNodeDataSchema>> {
  return v.safeParse(relationshipNodeDataSchema, data);
}
