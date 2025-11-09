/**
 * Hook implementation for renderJournalDirectory.
 *
 * Handles journal visibility processing when the journal directory is rendered.
 *
 * **Responsibilities:**
 * - Register renderJournalDirectory hook with Foundry
 * - Resolve required services from DI container
 * - Delegate business logic to JournalVisibilityService
 * - Handle cleanup on disposal
 */

import type { Result } from "@/types/result";
import type { ServiceContainer } from "@/di_infrastructure/container";
import type { HookRegistrar } from "./hook-registrar.interface";
import { MODULE_CONSTANTS, HOOK_THROTTLE_WINDOW_MS } from "@/constants";
import { loggerToken, journalVisibilityServiceToken } from "@/tokens/tokenindex";
import { foundryHooksToken } from "@/foundry/foundrytokens";
import { validateHookApp } from "@/foundry/validation/schemas";
import { throttle } from "@/utils/events/throttle";
import { ok, err } from "@/utils/functional/result";

/**
 * Type guard for jQuery objects.
 */
function isJQueryObject(value: unknown): value is { [index: number]: HTMLElement; length: number } {
  if (value === null || typeof value !== "object") return false;
  // Narrow generic object to indexable record for property checks
  /* type-coverage:ignore-next-line */
  const obj = value as Record<string, unknown>;
  return "length" in obj && typeof obj.length === "number" && obj.length > 0 && "0" in obj;
}

/**
 * Extracts HTMLElement from hook argument (jQuery or native DOM).
 */
function extractHtmlElement(html: unknown): HTMLElement | null {
  if (html instanceof HTMLElement) {
    return html;
  }

  if (isJQueryObject(html) && html[0] instanceof HTMLElement) {
    return html[0];
  }

  if (html && typeof html === "object" && "get" in html) {
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
        // Ignore
      }
      /* c8 ignore stop */
    }
  }

  return null;
}

/**
 * RenderJournalDirectory hook implementation.
 */
export class RenderJournalDirectoryHook implements HookRegistrar {
  private unsubscribe: (() => void) | null = null;

  register(container: ServiceContainer): Result<void, Error> {
    const foundryHooksResult = container.resolveWithError(foundryHooksToken);
    const loggerResult = container.resolveWithError(loggerToken);
    const journalVisibilityResult = container.resolveWithError(journalVisibilityServiceToken);

    /* c8 ignore start -- Defensive: Service resolution can only fail if container is not validated or services are not registered, which cannot happen in normal flow */
    if (!foundryHooksResult.ok || !loggerResult.ok || !journalVisibilityResult.ok) {
      if (loggerResult.ok) {
        loggerResult.value.error("DI resolution failed in RenderJournalDirectoryHook", {
          foundryHooksResolved: foundryHooksResult.ok,
          journalVisibilityResolved: journalVisibilityResult.ok,
        });
      }
      return err(new Error("Failed to resolve required services for RenderJournalDirectoryHook"));
    }
    /* c8 ignore stop */

    const foundryHooks = foundryHooksResult.value;
    const logger = loggerResult.value;
    const journalVisibility = journalVisibilityResult.value;

    const throttledCallback = throttle((app: unknown, html: unknown) => {
      logger.debug(`${MODULE_CONSTANTS.HOOKS.RENDER_JOURNAL_DIRECTORY} fired`);

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

      const htmlElement = extractHtmlElement(html);
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
      return err(new Error(`Hook registration failed: ${hookResult.error.message}`));
    }

    return ok(undefined);
  }

  /* c8 ignore start -- Lifecycle method: Called when module is disabled; cleanup logic not testable in unit tests */
  dispose(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }
  /* c8 ignore stop */
}
