import { MODULE_CONSTANTS } from "@/constants";
import { loggerToken, journalVisibilityServiceToken } from "@/tokens/tokenindex";
import { foundryHooksToken } from "@/foundry/foundrytokens";
import type { FoundryHooks } from "@/foundry/interfaces/FoundryHooks";
import type { ServiceContainer } from "@/di_infrastructure/container";

/**
 * ModuleHookRegistrar
 *
 * Bündelt die Registrierung aller Foundry-Hooks für dieses Modul. Muss NACH der
 * Port-Selektion im init-Hook aufgerufen werden, damit die finalen Ports aktiv sind.
 */
export class ModuleHookRegistrar {
  /**
   * Registriert alle benötigten Hooks.
   * @param container DI-Container mit final gebundenen Ports und Services
   */
  registerAll(container: ServiceContainer): void {
    const foundryHooks = container.resolve<FoundryHooks>(foundryHooksToken);
    const logger = container.resolve(loggerToken);
    const journalVisibility = container.resolve(journalVisibilityServiceToken);

    const hookResult = foundryHooks.on(MODULE_CONSTANTS.HOOKS.RENDER_JOURNAL_DIRECTORY, (app, html) => {
      logger.debug(`${MODULE_CONSTANTS.HOOKS.RENDER_JOURNAL_DIRECTORY} fired`);

      // In Foundry v13+, html is already an HTMLElement (no jQuery)
      const htmlElement = html as HTMLElement;
      if (!htmlElement) {
        logger.error("Failed to get HTMLElement from hook");
        return;
      }

      journalVisibility.processJournalDirectory(htmlElement);
    });
    
    if (!hookResult.ok) {
      logger.error(`Failed to register ${MODULE_CONSTANTS.HOOKS.RENDER_JOURNAL_DIRECTORY} hook: ${hookResult.error}`);
    }
  }
}
