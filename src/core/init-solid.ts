import { MODULE_CONSTANTS } from "../constants";
import { match } from "@/utils/result";
import type { Result } from "@/types/result";
import { ServiceContainer } from "@/di_infrastructure/container";
import { configureDependencies } from "@/config/dependencyconfig";
import { loggerToken } from "@/tokens/tokenindex";
import {
  foundryGameToken,
  foundryHooksToken,
  foundryDocumentToken,
  foundryUIToken,
} from "@/foundry/foundrytokens";
import type { FoundryGame } from "@/foundry/interfaces/FoundryGame";
import type { FoundryHooks } from "@/foundry/interfaces/FoundryHooks";
import type { FoundryDocument } from "@/foundry/interfaces/FoundryDocument";
import type { FoundryUI } from "@/foundry/interfaces/FoundryUI";
import type { FoundryJournalEntry } from "@/foundry/types";

/**
 * Safely gets journal entries that are marked as hidden using Foundry abstraction layer.
 */
function getHiddenJournalEntries(
  foundryGame: FoundryGame,
  foundryDocument: FoundryDocument
): Result<FoundryJournalEntry[], string> {
  const allEntriesResult = foundryGame.getJournalEntries();

  if (!allEntriesResult.ok) {
    return allEntriesResult;
  }

  const hidden: FoundryJournalEntry[] = [];
  for (const journal of allEntriesResult.value) {
    const flagResult = foundryDocument.getFlag<boolean>(
      journal as { getFlag: (scope: string, key: string) => unknown },
      MODULE_CONSTANTS.MODULE.ID,
      "hidden"
    );

    if (flagResult.ok && flagResult.value === true) {
      hidden.push(journal);
    }
  }

  return { ok: true, value: hidden };
}

/**
 * Initializes the module when Foundry VTT starts.
 * Registers hooks for hiding journal entries based on module flags.
 */
export function initializeModule(container: ServiceContainer): void {
  const foundryHooks = container.resolve<FoundryHooks>(foundryHooksToken);
  const foundryGame = container.resolve<FoundryGame>(foundryGameToken);
  const foundryDocument = container.resolve<FoundryDocument>(foundryDocumentToken);
  const foundryUI = container.resolve<FoundryUI>(foundryUIToken);

  // Register hook using Foundry abstraction
  foundryHooks.on("renderJournalDirectory", (app, html) => {
    const logger = container.resolve(loggerToken);
    logger.debug("renderJournalDirectory fired");

    const hiddenResult = getHiddenJournalEntries(foundryGame, foundryDocument);

    match(hiddenResult, {
      onOk: (hidden) => {
        logger.debug(
          "Found " + hidden.length + " hidden journal entries"
        );

        for (const journal of hidden) {
          const removeResult = foundryUI.removeJournalElement(
            journal.id,
            journal.name ?? "Unknown",
            html as HTMLElement
          );

          match(removeResult, {
            onOk: () => {
              logger.debug(
                "Removing journal entry: " + (journal.name ?? "Unknown")
              );
            },
            onErr: (error) => {
              logger.warn("Error removing journal entry: " + error);
            },
          });
        }
      },
      onErr: (error) => {
        const logger = container.resolve(loggerToken);
        logger.error("Error getting hidden journal entries: " + error);
      },
    });
  });
}

/**
 * Initializes the module when Foundry VTT starts.
 * Registers hooks for hiding journal entries based on module flags.
 */
const foundryHooksForInit = {
  on(hookName: string, callback: (...args: unknown[]) => void | Promise<void>): void {
    // During init, Hooks may not be available yet, so we use the global Hooks directly
    // This is only for the init hook itself - after container is set up, use the service
    if (typeof Hooks !== "undefined") {
      (Hooks as any).on(hookName as any, callback as any);
    }
  },
} as FoundryHooks;

foundryHooksForInit.on("init", () => {
  const loggerForInit = {
    log: (message: string) => console.log(`${MODULE_CONSTANTS.LOG_PREFIX} ${message}`),
    error: (message: string) => console.error(`${MODULE_CONSTANTS.LOG_PREFIX} ${message}`),
    warn: (message: string) => console.warn(`${MODULE_CONSTANTS.LOG_PREFIX} ${message}`),
    info: (message: string) => console.info(`${MODULE_CONSTANTS.LOG_PREFIX} ${message}`),
    debug: (message: string) => console.debug(`${MODULE_CONSTANTS.LOG_PREFIX} ${message}`),
  };

  loggerForInit.log("init");

  const container = new ServiceContainer();
  const configureResult = configureDependencies(container);
  match(configureResult, {
    onOk: () => {
      loggerForInit.log("dependencies configured");
      (globalThis as any).container = container;

      // Initialize module with Foundry services
      initializeModule(container);

      // Direct resolution with automatic fallback - no Result-Check needed
      const logger = container.resolve(loggerToken);
      logger.info("Logger resolved");
      logger.info("init completed");
    },
    onErr: (error) => {
      loggerForInit.error(error);
      (globalThis as any).container = null;
    },
  });
});

/**
 * Ready hook: Module initialization complete.
 * Executes when Foundry VTT is fully ready.
 */
const foundryHooksForReady = {
  on(hookName: string, callback: (...args: unknown[]) => void | Promise<void>): void {
    if (typeof Hooks !== "undefined") {
      (Hooks as any).on(hookName as any, callback as any);
    }
  },
} as FoundryHooks;

foundryHooksForReady.on("ready", () => {
  const container = (globalThis as any).container;
  if (!container) {
    console.error(`${MODULE_CONSTANTS.LOG_PREFIX} Container not available in ready hook`);
    return;
  }
  const logger = container.resolve(loggerToken);
  logger.info("Module ready");
});
