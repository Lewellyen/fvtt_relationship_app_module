Object.assign = function(target, ...sources) {
  for (const source of sources) {
    if (source != null) {
      for (const key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key) && key !== "equals") {
          try {
            target[key] = source[key];
          } catch {
          }
        }
      }
    }
  }
  return target;
};
//# sourceMappingURL=fvtt_relationship_app_module.js.map
