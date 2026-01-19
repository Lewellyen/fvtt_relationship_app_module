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
  public?: string | undefined;
  hidden?: string | undefined;
  gm?: string | undefined;
}

/**
 * Effects based on relation type.
 */
export interface NodeEffects {
  friend?: string | undefined;
  enemy?: string | undefined;
  neutral?: string | undefined;
}

/**
 * Backup structure for migration.
 * Contains the previous version's data before migration.
 */
export interface NodeDataLastVersion {
  schemaVersion: number;
  // Previous version's data structure (will be defined in Phase 3)
  [key: string]: unknown;
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
  factionId?: string | undefined;
  relation: RelationType;
  icon?: string | undefined;
  descriptions: NodeDescriptions;
  reveal: NodeReveal;
  effects?: NodeEffects | undefined;
  linkedEntityUuid?: string | undefined;
  // Backup für Migration (wird in Phase 3 verwendet)
  lastVersion?: NodeDataLastVersion | undefined;
}
