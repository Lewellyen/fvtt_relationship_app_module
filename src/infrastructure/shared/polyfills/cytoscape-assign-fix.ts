/**
 * Polyfill für Cytoscape: Object.assign readonly 'equals' fix
 *
 * ⚠️ WICHTIG: Dieser Polyfill ist ein Legacy-Patch für die Cytoscape-Bibliothek.
 * NIEMALS ÄNDERN - könnte das Verhalten der Cytoscape-Integration beeinträchtigen.
 */
/* v8 ignore file -- Legacy polyfill, schwer testbar ohne Browser-Integration -- @preserve */
/* eslint-disable @typescript-eslint/no-explicit-any, eqeqeq */
// Legacy polyfill: `any` required for low-level Object.assign patching

// Patch Object.assign only once and keep original semantics wherever possible
const originalAssignRef = Object.assign as any;
if (!(originalAssignRef && originalAssignRef.__cy_careful_patch)) {
  const patched = function (target: any, ...sources: any[]) {
    const filteredSources = sources.map((source) => {
      if (source == null) return source;
      // Create a shallow copy excluding the problematic 'equals' key
      const out: any = {};
      for (const key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key) && key !== "equals") {
          out[key] = (source as any)[key];
        }
      }
      return out;
    });
    try {
      return originalAssignRef(target, ...filteredSources);
    } catch {
      // Fallback to naive assignment filtering readonly errors
      for (const src of filteredSources) {
        if (src != null) {
          for (const k in src) {
            try {
              (target as any)[k] = (src as any)[k];
            } catch {}
          }
        }
      }
      return target;
    }
  } as typeof Object.assign & { __cy_careful_patch?: boolean };
  (patched as any).__cy_careful_patch = true;
  Object.assign = patched as any;
}
