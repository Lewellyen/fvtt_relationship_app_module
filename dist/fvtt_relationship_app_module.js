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
const RAM_CONSTANTS = {
  MODULE_ID: "fvtt_relationship_app_module",
  MODULE_NAME: "Beziehungsnetzwerke für Foundry",
  MODULE_VERSION: "0.0.1",
  MODULE_AUTHOR: "Andreas Rothe",
  MODULE_AUTHOR_EMAIL: "forenadmin.tir@gmail.com",
  MODULE_AUTHOR_DISCORD: "lewellyen",
  MODULE_AUTHOR_URL: "https://github.com/lewellyen",
  MODULE_AUTHOR_URL_GITHUB: "https://github.com/lewellyen",
  MODULE_AUTHOR_URL_GITHUB_REPO: "https://github.com/lewellyen/fvtt-relationship-app-module",
  MODULE_AUTHOR_URL_GITHUB_REPO_ISSUES: "https://github.com/lewellyen/fvtt-relationship-app-module/issues",
  MODULE_AUTHOR_URL_GITHUB_REPO_ISSUES_NEW: "https://github.com/lewellyen/fvtt-relationship-app-module/issues/new",
  MODULE_AUTHOR_URL_GITHUB_REPO_ISSUES_NEW_ISSUE: "https://github.com/lewellyen/fvtt-relationship-app-module/issues/new",
  MODULE_LOG_PREFIX: "FVTT RAM |"
};
Hooks.on("init", () => {
  console.log(`${RAM_CONSTANTS.MODULE_LOG_PREFIX} init`);
});
Hooks.on("ready", () => {
  console.log(`${RAM_CONSTANTS.MODULE_LOG_PREFIX} ready`);
});
//# sourceMappingURL=fvtt_relationship_app_module.js.map
