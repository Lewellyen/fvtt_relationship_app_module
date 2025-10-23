// Polyfill für Cytoscape: Object.assign readonly 'equals' fix
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
