/**
 * Polyfill für Cytoscape: Object.assign readonly 'equals' fix
 *
 * ⚠️ WICHTIG: Dieser Polyfill ist ein Legacy-Patch für die Cytoscape-Bibliothek.
 * NIEMALS ÄNDERN - könnte das Verhalten der Cytoscape-Integration beeinträchtigen.
 */
Object.assign = function (target: any, ...sources: any[]) {
  for (const source of sources) {
    if (source != null) {
      for (const key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key) && key !== "equals") {
          try {
            target[key] = source[key];
          } catch {
            // Ignore readonly property errors
          }
        }
      }
    }
  }
  return target;
};
