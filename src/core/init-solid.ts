import { MODULE_CONSTANTS } from "../constants";
import { ok, err, tryCatch, match } from "@/utils/result";
import type { Result } from "@/types/result";
import { ServiceContainer } from "@/di_infrastructure/container";
import { configureDependencies } from "@/config/dependencyconfig";
import { loggerToken } from "@/tokens/tokenindex";

/**
 * Safely gets journal entries that are marked as hidden.
 */
function getHiddenJournalEntries(): Result<any[], string> {
  return tryCatch(
    () => {
      if (!game?.journal) {
        throw new Error("game.journal is not available");
      }
      return (game as any).journal.filter(
        (j: any) => j.getFlag(MODULE_CONSTANTS.MODULE.ID as any, "hidden") === true
      );
    },
    (error) => `Failed to get hidden journal entries: ${error}`
  );
}

/**
 * Safely removes a journal entry from the UI.
 */
function removeJournalElement(
  journalId: string,
  journalName: string,
  html: HTMLElement
): Result<void, string> {
  const element = html.querySelector(
    `li.directory-item[data-entry-id="${journalId}"]`
  ) as HTMLElement;

  if (!element) {
    return err(`Could not find element for journal entry: ${journalName} (${journalId})`);
  }

  element.remove();
  return ok(undefined);
}

/**
 * Initializes the module when Foundry VTT starts.
 * Registers hooks for hiding journal entries based on module flags.
 */
Hooks.on("init", () => {
  console.log(`${MODULE_CONSTANTS.LOG_PREFIX} init`);

  Hooks.on("renderJournalDirectory", (app, html) => {
    console.debug(`${MODULE_CONSTANTS.LOG_PREFIX} renderJournalDirectory fired`, app);

    const hiddenResult = getHiddenJournalEntries();

    match(hiddenResult, {
      onOk: (hidden) => {
        console.debug(
          `${MODULE_CONSTANTS.LOG_PREFIX} Found ${hidden.length} hidden journal entries`
        );

        for (const journal of hidden) {
          const removeResult = removeJournalElement(journal.id, journal.name, html as HTMLElement);

          match(removeResult, {
            onOk: () => {
              console.debug(
                `${MODULE_CONSTANTS.LOG_PREFIX} Removing journal entry: ${journal.name}`
              );
            },
            onErr: (error) => {
              console.warn(`${MODULE_CONSTANTS.LOG_PREFIX} ${error}`);
            },
          });
        }
      },
      onErr: (error) => {
        console.error(`${MODULE_CONSTANTS.LOG_PREFIX} ${error}`);
      },
    });
  });

  const container = new ServiceContainer();
  const configureResult = configureDependencies(container);
  match(configureResult, {
    onOk: () => {
      console.log(`${MODULE_CONSTANTS.LOG_PREFIX} dependencies configured`);
      (globalThis as any).container = container;
    },
    onErr: (error) => {
      console.error(`${MODULE_CONSTANTS.LOG_PREFIX} ${error}`);
      (globalThis as any).container = null;
    },
  });

  // Direct resolution with automatic fallback - no Result-Check needed
  const logger = container.resolve(loggerToken);
  logger.info("Logger resolved");
  logger.info("init completed");
});

/**
 * Ready hook: Module initialization complete.
 * Executes when Foundry VTT is fully ready.
 */
Hooks.on("ready", () => {
  const container = (globalThis as any).container;
  const logger = container.resolve(loggerToken);
  logger.info("Module ready");
});
