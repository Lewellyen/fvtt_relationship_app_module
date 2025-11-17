/**
 * Hook implementation for renderJournalDirectory.
 *
 * Handles journal visibility processing when the journal directory is rendered.
 *
 * **Responsibilities:**
 * - Register renderJournalDirectory hook with Foundry
 * - Delegate business logic to JournalVisibilityService
 * - Handle cleanup on disposal
 */

import type { Result } from "@/types/result";
import type { HookRegistrar } from "./hook-registrar.interface";
import { HookRegistrationManager } from "./hook-registration-manager";
import { MODULE_CONSTANTS, HOOK_THROTTLE_WINDOW_MS } from "@/constants";
import { journalVisibilityServiceToken, notificationCenterToken } from "@/tokens/tokenindex";
import { foundryHooksToken } from "@/foundry/foundrytokens";
import type { FoundryHooks } from "@/foundry/interfaces/FoundryHooks";
import type { NotificationCenter } from "@/notifications/NotificationCenter";
import type { JournalVisibilityService } from "@/services/JournalVisibilityService";
import { validateHookApp } from "@/foundry/validation/schemas";
import { throttle } from "@/utils/events/throttle";
import { ok, err } from "@/utils/functional/result";
import { extractHtmlElement } from "@/foundry/runtime-casts";

/**
 * RenderJournalDirectory hook implementation.
 *
 * NOTE: All dependencies are injected via constructor to follow the DI-Wrapper pattern.
 * The ServiceContainer parameter in register() is kept for HookRegistrar interface
 * compatibility but is not used anymore.
 */
export class RenderJournalDirectoryHook implements HookRegistrar {
  private readonly registrationManager = new HookRegistrationManager();

  constructor(
    private readonly foundryHooks: FoundryHooks,
    private readonly journalVisibility: JournalVisibilityService,
    private readonly notificationCenter: NotificationCenter
  ) {}

  // container parameter removed: HookRegistrar implementiert register() aktuell ohne Container-Nutzung
  register(): Result<void, Error> {
    const { foundryHooks, journalVisibility, notificationCenter } = this;

    const throttledCallback = throttle((app: unknown, html: unknown) => {
      notificationCenter.debug(
        `${MODULE_CONSTANTS.HOOKS.RENDER_JOURNAL_DIRECTORY} fired`,
        { context: { app, html } },
        { channels: ["ConsoleChannel"] }
      );

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

    // Persist registration for clean disposal
    const registrationId = hookResult.value;
    this.registrationManager.register(() => {
      foundryHooks.off(MODULE_CONSTANTS.HOOKS.RENDER_JOURNAL_DIRECTORY, registrationId);
    });

    return ok(undefined);
  }

  dispose(): void {
    this.registrationManager.dispose();
  }
}

export class DIRenderJournalDirectoryHook extends RenderJournalDirectoryHook {
  static dependencies = [
    foundryHooksToken,
    journalVisibilityServiceToken,
    notificationCenterToken,
  ] as const;

  constructor(
    foundryHooks: FoundryHooks,
    journalVisibility: JournalVisibilityService,
    notificationCenter: NotificationCenter
  ) {
    super(foundryHooks, journalVisibility, notificationCenter);
  }
}
