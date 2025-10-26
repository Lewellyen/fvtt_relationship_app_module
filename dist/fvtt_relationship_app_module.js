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
const MODULE_CONSTANTS = {
  MODULE: {
    ID: "fvtt_relationship_app_module",
    NAME: "Beziehungsnetzwerke für Foundry",
    AUTHOR: "Andreas Rothe",
    AUTHOR_EMAIL: "forenadmin.tir@gmail.com",
    AUTHOR_DISCORD: "lewellyen"
  },
  LOG_PREFIX: "Foundry VTT Relationship App Module |"
};
Hooks.on("init", () => {
  console.log(`${MODULE_CONSTANTS.LOG_PREFIX} init`);
  Hooks.on("renderJournalDirectory", (app, html) => {
    console.debug(`${MODULE_CONSTANTS.LOG_PREFIX} renderJournalDirectory fired`, app);
    const hidden = game.journal.filter((j) => j.getFlag(MODULE_CONSTANTS.MODULE.ID, "hidden") === true);
    console.debug(`${MODULE_CONSTANTS.LOG_PREFIX} Found ${hidden.length} hidden journal entries`);
    for (const j of hidden) {
      const element = html.querySelector(`li.directory-item[data-entry-id="${j.id}"]`);
      if (element) {
        console.debug(`${MODULE_CONSTANTS.LOG_PREFIX} Removing journal entry: ${j.name}`);
        element.remove();
      } else {
        console.warn(`${MODULE_CONSTANTS.LOG_PREFIX} Could not find element for journal entry: ${j.name} (${j.id})`);
      }
    }
  });
});
Hooks.on("ready", () => {
  console.log(`${MODULE_CONSTANTS.LOG_PREFIX} ready`);
});
//# sourceMappingURL=fvtt_relationship_app_module.js.map
