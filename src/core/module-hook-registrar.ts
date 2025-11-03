import { MODULE_CONSTANTS } from "@/constants";
import { loggerToken, journalVisibilityServiceToken } from "@/tokens/tokenindex";
import { foundryHooksToken } from "@/foundry/foundrytokens";
import type { FoundryHooks } from "@/foundry/interfaces/FoundryHooks";
import type { ServiceContainer } from "@/di_infrastructure/container";

/**
 * Type guard for jQuery objects.
 * jQuery objects are array-like with numeric index and length property.
 */
function isJQueryObject(value: unknown): value is { [index: number]: HTMLElement; length: number } {
  return (
    value !== null &&
    typeof value === "object" &&
    "length" in value &&
    typeof (value as any).length === "number" &&
    (value as any).length > 0 &&
    "0" in value
  );
}

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

    const hookResult = foundryHooks.on(
      MODULE_CONSTANTS.HOOKS.RENDER_JOURNAL_DIRECTORY,
      (app, html) => {
        logger.debug(`${MODULE_CONSTANTS.HOOKS.RENDER_JOURNAL_DIRECTORY} fired`);

        // FIX: Extract HTMLElement from either jQuery or native DOM
        const htmlElement = this.extractHtmlElement(html);
        if (!htmlElement) {
          logger.error("Failed to get HTMLElement from hook - incompatible format");
          return;
        }

        journalVisibility.processJournalDirectory(htmlElement);
      }
    );

    if (!hookResult.ok) {
      logger.error(
        `Failed to register ${MODULE_CONSTANTS.HOOKS.RENDER_JOURNAL_DIRECTORY} hook: ${hookResult.error}`
      );
    }
  }

  /**
   * Extracts HTMLElement from hook argument (jQuery or native DOM).
   *
   * Foundry v10-12: hooks pass jQuery wrapper objects
   * Foundry v13+: hooks pass native HTMLElement
   *
   * @param html - Hook argument (HTMLElement, jQuery, or unknown)
   * @returns HTMLElement or null if extraction failed
   */
  private extractHtmlElement(html: unknown): HTMLElement | null {
    // Case 1: Native HTMLElement (Foundry v13+)
    if (html instanceof HTMLElement) {
      return html;
    }

    // Case 2: jQuery object with numeric index (Foundry v10-12)
    if (isJQueryObject(html) && html[0] instanceof HTMLElement) {
      return html[0];
    }

    // Case 3: jQuery with .get() method (additional safety)
    if (
      html &&
      typeof html === "object" &&
      "get" in html &&
      typeof (html as any).get === "function"
    ) {
      try {
        const element = (html as any).get(0);
        if (element instanceof HTMLElement) {
          return element;
        }
      } catch {
        // Ignore get() errors
      }
    }

    return null;
  }
}
