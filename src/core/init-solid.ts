import { MODULE_CONSTANTS } from "../constants";

Hooks.on("init", () => {
  console.log(`${MODULE_CONSTANTS.LOG_PREFIX} init`);
  Hooks.on("renderJournalDirectory", (app, html) => {
    console.debug(`${MODULE_CONSTANTS.LOG_PREFIX} renderJournalDirectory fired`, app);

    const hidden = (game as any).journal.filter((j: any) => j.getFlag(MODULE_CONSTANTS.MODULE.ID as any, "hidden") === true);
    console.debug(`${MODULE_CONSTANTS.LOG_PREFIX} Found ${hidden.length} hidden journal entries`);
    
    for (const j of hidden) {
      const element = (html as HTMLElement).querySelector(`li.directory-item[data-entry-id="${j.id}"]`) as HTMLElement;
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

