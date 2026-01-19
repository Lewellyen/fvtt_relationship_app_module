/**
 * Domain type for relationship graph data.
 * Represents a graph containing nodes, edges, and layout information.
 *
 * This type is platform-agnostic and represents the domain model.
 * Data is stored in JournalEntryPage.system for persistence.
 */

/**
 * Schema version for relationship graph data.
 * Used for migration support in future phases.
 */
export const RELATIONSHIP_GRAPH_SCHEMA_VERSION = 1;

/**
 * Knowledge visibility levels for edges.
 */
export type EdgeKnowledge = "public" | "hidden" | "secret";

/**
 * Edge in the relationship graph.
 */
export interface RelationshipEdge {
  id: string;
  source: string; // nodeKey
  target: string; // nodeKey
  knowledge: EdgeKnowledge;
  label?: string | undefined;
}

/**
 * Position coordinates for layout.
 */
export interface Position {
  x: number;
  y: number;
}

/**
 * Pan coordinates for layout.
 */
export interface Pan {
  x: number;
  y: number;
}

/**
 * Layout information for graph visualization.
 */
export interface GraphLayout {
  positions?: Record<string, Position> | undefined;
  zoom?: number | undefined;
  pan?: Pan | undefined;
}

/**
 * Backup structure for migration.
 * Contains the previous version's data before migration.
 */
export interface GraphDataLastVersion {
  schemaVersion: number;
  // Previous version's data structure (will be defined in Phase 3)
  [key: string]: unknown;
}

/**
 * Relationship graph data structure.
 * Schema version 1 (MVP).
 */
export interface RelationshipGraphData {
  schemaVersion: typeof RELATIONSHIP_GRAPH_SCHEMA_VERSION;
  graphKey: string; // Foundry Page.uuid
  nodeKeys: string[];
  edges: RelationshipEdge[];
  layout?: GraphLayout | undefined;
  // Backup f〉 Migration (wird in Phase 3 verwendet)
  lastVersion?: GraphDataLastVersion | undefined;
}
