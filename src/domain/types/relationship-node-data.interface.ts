/**
 * Domain type for relationship node data.
 * Represents a single node/wissensobjekt in a relationship graph.
 *
 * This type is platform-agnostic and represents the domain model.
 * Data is stored in JournalEntryPage.system for persistence.
 */

/**
 * Schema version for relationship node data.
 * Used for migration support in future phases.
 */
export const RELATIONSHIP_NODE_SCHEMA_VERSION = 1;

/**
 * Node kind types.
 */
export type NodeKind = "person" | "place" | "object";

/**
 * Relation types for nodes.
 */
export type RelationType = "friend" | "enemy" | "neutral";

/**
 * Visibility settings for node content.
 */
export interface NodeReveal {
  public: boolean;
  hidden: boolean;
}

/**
 * Description texts with visibility levels.
 */
export interface NodeDescriptions {
  public?: string;
  hidden?: string;
  gm?: string;
}

/**
 * Effects based on relation type.
 */
export interface NodeEffects {
  friend?: string;
  enemy?: string;
  neutral?: string;
}

/**
 * Relationship node data structure.
 * Schema version 1 (MVP).
 */
export interface RelationshipNodeData {
  schemaVersion: typeof RELATIONSHIP_NODE_SCHEMA_VERSION;
  nodeKey: string; // Foundry Page.uuid
  name: string;
  kind: NodeKind;
  factionId?: string;
  relation: RelationType;
  icon?: string;
  descriptions: NodeDescriptions;
  reveal: NodeReveal;
  effects?: NodeEffects;
  linkedEntityUuid?: string;
}

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

export interface RelationshipNodeDataSchema extends foundry.data.fields.DataSchema {
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
}
