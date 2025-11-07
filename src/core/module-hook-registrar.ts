import { MODULE_CONSTANTS, HOOK_THROTTLE_WINDOW_MS } from "@/constants";
import { loggerToken, journalVisibilityServiceToken } from "@/tokens/tokenindex";
import { foundryHooksToken } from "@/foundry/foundrytokens";
import type { ServiceContainer } from "@/di_infrastructure/container";
import { validateHookApp } from "@/foundry/validation/schemas";
import { throttle } from "@/utils/throttle";

/**
 * Type guard for jQuery objects.
 * jQuery objects are array-like with numeric index and length property.
 */
function isJQueryObject(value: unknown): value is { [index: number]: HTMLElement; length: number } {
  if (value === null || typeof value !== "object") return false;

  // Narrow generic object to indexable record for property checks
  /* type-coverage:ignore-next-line */
  const obj = value as Record<string, unknown>;
  return "length" in obj && typeof obj.length === "number" && obj.length > 0 && "0" in obj;
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
    const foundryHooksResult = container.resolveWithError(foundryHooksToken);
    const loggerResult = container.resolveWithError(loggerToken);
    const journalVisibilityResult = container.resolveWithError(journalVisibilityServiceToken);

    // Early return if any resolution failed
    /* c8 ignore start -- Defensive: Service resolution can only fail if container is not validated or services are not registered, which cannot happen in normal flow */
    if (!foundryHooksResult.ok || !loggerResult.ok || !journalVisibilityResult.ok) {
      // Use logger if available, otherwise fallback to console
      if (loggerResult.ok) {
        loggerResult.value.error("DI resolution failed in ModuleHookRegistrar", {
          foundryHooksResolved: foundryHooksResult.ok,
          journalVisibilityResolved: journalVisibilityResult.ok,
        });
      } else {
        // Fallback only if logger itself failed to resolve
        console.error("Failed to resolve required services for hook registration");
      }
      return;
    }
    /* c8 ignore stop */

    const foundryHooks = foundryHooksResult.value;
    const logger = loggerResult.value;
    const journalVisibility = journalVisibilityResult.value;

    // Throttle hook callback to prevent excessive calls (e.g. rapid directory refreshes)
    // HOOK_THROTTLE_WINDOW_MS allows ~10 calls/second max
    const throttledCallback = throttle((app: unknown, html: unknown) => {
      logger.debug(`${MODULE_CONSTANTS.HOOKS.RENDER_JOURNAL_DIRECTORY} fired`);

      // Validate app parameter
      const appValidation = validateHookApp(app);
      if (!appValidation.ok) {
        logger.error(
          `Invalid app parameter in ${MODULE_CONSTANTS.HOOKS.RENDER_JOURNAL_DIRECTORY} hook`,
          {
            code: appValidation.error.code,
            message: appValidation.error.message,
            details: appValidation.error.details,
          }
        );
        return;
      }

      // FIX: Extract HTMLElement from either jQuery or native DOM
      const htmlElement = this.extractHtmlElement(html);
      if (!htmlElement) {
        logger.error("Failed to get HTMLElement from hook - incompatible format");
        return;
      }

      journalVisibility.processJournalDirectory(htmlElement);
    }, HOOK_THROTTLE_WINDOW_MS);

    const hookResult = foundryHooks.on(
      MODULE_CONSTANTS.HOOKS.RENDER_JOURNAL_DIRECTORY,
      throttledCallback
    );

    if (!hookResult.ok) {
      logger.error(
        `Failed to register ${MODULE_CONSTANTS.HOOKS.RENDER_JOURNAL_DIRECTORY} hook: ${hookResult.error.message}`,
        {
          code: hookResult.error.code,
          details: hookResult.error.details,
          cause: hookResult.error.cause,
        }
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
    if (html && typeof html === "object" && "get" in html) {
      // Casting to Record enables type-safe access to get() helper for jQuery-like objects
      const obj = html as Record<string, unknown>;
      if (typeof obj.get === "function") {
        try {
          // jQuery get returns unknown; treat as index-based accessor for HTMLElement lookup
          /* type-coverage:ignore-next-line */
          const element = (obj.get as (index: number) => unknown)(0);
          if (element instanceof HTMLElement) {
            return element;
          }
          /* c8 ignore start -- Defensive: Ignore errors from accessing journal entry properties that may not exist */
        } catch {
          // Intentionally empty catch block
        }
        /* c8 ignore stop */
      }
    }

    return null;
  }
}
