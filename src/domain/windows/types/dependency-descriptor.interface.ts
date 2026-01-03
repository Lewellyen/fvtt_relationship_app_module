/**
 * DependencyDescriptor - Beschreibt Abhängigkeiten eines Fensters
 *
 * Wird für Relevanz-Prüfung bei Hook-Updates verwendet.
 */
export interface DependencyDescriptor {
  readonly type: "document" | "setting" | "flag" | "custom";
  readonly documentType?: string; // z.B. "Actor", "Item"
  readonly documentId?: string; // Optional: spezifisches Document
  readonly namespace?: string; // Für settings/flags
  readonly key?: string; // Für settings/flags
}
