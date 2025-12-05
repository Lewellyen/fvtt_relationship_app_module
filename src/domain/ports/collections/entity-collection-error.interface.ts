/**
 * Platform-agnostic error for entity collection operations.
 *
 * Ausgelagert in separate Datei, um zirkuläre Abhängigkeiten zwischen
 * EntityQueryBuilder und PlatformEntityCollectionPort zu vermeiden.
 */
export interface EntityCollectionError {
  code:
    | "COLLECTION_NOT_AVAILABLE" // Platform not initialized
    | "ENTITY_NOT_FOUND" // Specific entity not found
    | "INVALID_ENTITY_DATA" // Entity data corrupted
    | "INVALID_QUERY" // Search query invalid
    | "PLATFORM_ERROR"; // Generic platform error
  message: string;
  details?: unknown;
}
