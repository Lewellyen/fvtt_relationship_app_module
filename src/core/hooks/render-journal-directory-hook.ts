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
import {
  loggerToken,
  journalVisibilityServiceToken,
  notificationCenterToken,
} from "@/tokens/tokenindex";
import { foundryHooksToken } from "@/foundry/foundrytokens";
import { validateHookApp } from "@/foundry/validation/schemas";
import { throttle } from "@/utils/events/throttle";
import { ok, err } from "@/utils/functional/result";

/**
 * Extracts HTMLElement from hook argument.
 *
 * In Foundry VTT V13+, hooks receive native HTMLElement directly.
 * jQuery support has been deprecated and is no longer needed.
 */
function extractHtmlElement(html: unknown): HTMLElement | null {
  return html instanceof HTMLElement ? html : null;
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
    const notificationCenterResult = container.resolveWithError(notificationCenterToken);

    /* c8 ignore start -- Defensive: Service resolution can only fail if container is not validated or services are not registered, which cannot happen in normal flow */
    if (
      !foundryHooksResult.ok ||
      !loggerResult.ok ||
      !journalVisibilityResult.ok ||
      !notificationCenterResult.ok
    ) {
      if (loggerResult.ok) {
        loggerResult.value.error("DI resolution failed in RenderJournalDirectoryHook", {
          foundryHooksResolved: foundryHooksResult.ok,
          journalVisibilityResolved: journalVisibilityResult.ok,
          notificationCenterResolved: notificationCenterResult.ok,
        });
      }
      return err(new Error("Failed to resolve required services for RenderJournalDirectoryHook"));
    }
    /* c8 ignore stop */

    const foundryHooks = foundryHooksResult.value;
    const logger = loggerResult.value;
    const journalVisibility = journalVisibilityResult.value;
    const notificationCenter = notificationCenterResult.value;

    const throttledCallback = throttle((app: unknown, html: unknown) => {
      logger.debug(`${MODULE_CONSTANTS.HOOKS.RENDER_JOURNAL_DIRECTORY} fired`);

      const appValidation = validateHookApp(app);
      if (!appValidation.ok) {
        // Log to console only (internal error, no UI notification)
        notificationCenter.error(
          `Invalid app parameter in ${MODULE_CONSTANTS.HOOKS.RENDER_JOURNAL_DIRECTORY} hook`,
          appValidation.error,
          { channels: ["ConsoleChannel"] }
        );
        return;
      }

      const htmlElement = extractHtmlElement(html);
      if (!htmlElement) {
        // Log to console only (internal error, no UI notification)
        notificationCenter.error(
          "Failed to get HTMLElement from hook - incompatible format",
          {
            code: "INVALID_HTML_ELEMENT",
            message: "HTMLElement could not be extracted from hook arguments.",
          },
          { channels: ["ConsoleChannel"] }
        );
        return;
      }

      journalVisibility.processJournalDirectory(htmlElement);
    }, HOOK_THROTTLE_WINDOW_MS);

    const hookResult = foundryHooks.on(
      MODULE_CONSTANTS.HOOKS.RENDER_JOURNAL_DIRECTORY,
      throttledCallback
    );

    if (!hookResult.ok) {
      // Bootstrap error - log to console only (no UI notification)
      notificationCenter.error(
        `Failed to register ${MODULE_CONSTANTS.HOOKS.RENDER_JOURNAL_DIRECTORY} hook`,
        hookResult.error,
        {
          channels: ["ConsoleChannel"],
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

export class DIRenderJournalDirectoryHook extends RenderJournalDirectoryHook {
  static dependencies = [] as const;

  constructor() {
    super();
  }
}
