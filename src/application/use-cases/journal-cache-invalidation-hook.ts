import type { Result } from "@/domain/types/result";
import { ok, err } from "@/infrastructure/shared/utils/result";
import type { HookRegistrar } from "./hook-registrar.interface";
import { HookRegistrationManager } from "./hook-registration-manager";
import { MODULE_CONSTANTS } from "@/infrastructure/shared/constants";
import { foundryHooksToken, foundryGameToken } from "@/infrastructure/shared/tokens";
import {
  cacheServiceToken,
  notificationCenterToken,
  journalVisibilityServiceToken,
} from "@/infrastructure/shared/tokens";
import type { CacheService } from "@/infrastructure/cache/cache.interface";
import type { NotificationCenter } from "@/infrastructure/notifications/NotificationCenter";
import type { FoundryHooks } from "@/infrastructure/adapters/foundry/interfaces/FoundryHooks";
import type { FoundryGame } from "@/infrastructure/adapters/foundry/interfaces/FoundryGame";
import type { JournalVisibilityService } from "@/application/services/JournalVisibilityService";
import { HIDDEN_JOURNAL_CACHE_TAG } from "@/application/services/JournalVisibilityService";
import {
  getFirstArrayElement,
  castCacheValue,
} from "@/infrastructure/di/types/utilities/runtime-safe-cast";

const JOURNAL_INVALIDATION_HOOKS = [
  MODULE_CONSTANTS.HOOKS.CREATE_JOURNAL_ENTRY,
  MODULE_CONSTANTS.HOOKS.UPDATE_JOURNAL_ENTRY,
  MODULE_CONSTANTS.HOOKS.DELETE_JOURNAL_ENTRY,
] as const;

export class JournalCacheInvalidationHook implements HookRegistrar {
  private readonly registrationManager = new HookRegistrationManager();

  constructor(
    private readonly hooks: FoundryHooks,
    private readonly cache: CacheService,
    private readonly notificationCenter: NotificationCenter,
    private readonly foundryGame: FoundryGame,
    private readonly journalVisibility: JournalVisibilityService
  ) {}

  // container parameter entfernt: HookRegistrar-Implementierung nutzt Container nicht mehr direkt
  register(): Result<void, Error> {
    const { hooks, cache, notificationCenter, foundryGame } = this;

    for (const hookName of JOURNAL_INVALIDATION_HOOKS) {
      // Use regular function instead of arrow function to access 'arguments'
      const registrationResult = hooks.on(
        hookName,
        function (this: JournalCacheInvalidationHook, ...args: unknown[]) {
          // Invalidate CacheService cache (for hidden entries)
          const removed = cache.invalidateWhere((meta) =>
            meta.tags.includes(HIDDEN_JOURNAL_CACHE_TAG)
          );
          if (removed > 0) {
            notificationCenter.debug(
              `Invalidated ${removed} hidden journal cache entries via ${hookName}`,
              { context: { removed, hookName } },
              { channels: ["ConsoleChannel"] }
            );
          }

          // Invalidate FoundryGamePort cache (for journal entries list)
          // This ensures newly created/updated entries are immediately available
          foundryGame.invalidateCache();

          // Handle updateJournalEntry: Check if hidden flag was changed
          // Foundry only renders automatically when name/img/ownership/sort/folder change,
          // NOT when flags change. So we need to manually trigger a render.
          if (hookName === MODULE_CONSTANTS.HOOKS.UPDATE_JOURNAL_ENTRY) {
            const entry = this.getEntryFromHookArgs(args);
            if (entry?.id) {
              // Check if hidden flag was changed (set to true or false)
              const hiddenFlagChanged = this.checkHiddenFlagChanged(entry.id);
              if (hiddenFlagChanged) {
                const hiddenFlag = this.getHiddenFlagValue(entry.id);
                this.notificationCenter.debug(
                  `Hidden flag changed for journal entry ${entry.id} (value: ${hiddenFlag}), triggering re-render`,
                  { context: { entryId: entry.id, hiddenFlag } },
                  { channels: ["ConsoleChannel"] }
                );

                // Manually trigger re-render (Foundry won't do it automatically for flag changes)
                // The updateJournalEntry hook fires AFTER the flag is saved, so no delay is needed.
                // This will hide entries when flag is true, and show them when flag is false
                this.rerenderJournalDirectory();
              }
            }
          }
        }.bind(this)
      );

      if (!registrationResult.ok) {
        notificationCenter.error(`Failed to register ${hookName} hook`, registrationResult.error, {
          channels: ["ConsoleChannel"],
        });

        // Roll back any previously registered hooks to avoid partial registration state
        this.registrationManager.dispose();

        return err(new Error(`Hook registration failed: ${registrationResult.error.message}`));
      }

      const registrationId = registrationResult.value;
      this.registrationManager.register(() => {
        hooks.off(hookName, registrationId);
      });
    }

    return ok(undefined);
  }

  /**
   * Checks if the hidden flag was changed for a journal entry.
   * Returns true if the flag is set (true or false), meaning it was explicitly set.
   * This allows us to re-render when entries are hidden OR shown.
   * @param entryId - The journal entry ID
   * @returns true if hidden flag is set (true or false), false if not set or error
   */
  private checkHiddenFlagChanged(entryId: string): boolean {
    try {
      if (typeof game === "undefined" || !game?.journal) return false;

      const entry = game.journal.get(entryId);
      if (!entry) return false;

      // Type guard to check if entry has getFlag method
      if (typeof entry !== "object" || entry === null || !("getFlag" in entry)) {
        return false;
      }

      const getFlagMethod = castCacheValue<(scope: string, key: string) => unknown>(entry.getFlag);
      const hiddenFlag = castCacheValue<boolean | undefined | null>(
        getFlagMethod(MODULE_CONSTANTS.MODULE.ID, MODULE_CONSTANTS.FLAGS.HIDDEN)
      );
      // Flag is set if it's explicitly true or false (not undefined/null)
      return hiddenFlag === true || hiddenFlag === false;
    } catch (error) {
      this.notificationCenter.debug(
        "Failed to check hidden flag",
        { error: error instanceof Error ? error.message : String(error), entryId },
        { channels: ["ConsoleChannel"] }
      );
      return false;
    }
  }

  /**
   * Gets the current value of the hidden flag for a journal entry.
   * @param entryId - The journal entry ID
   * @returns the flag value (true/false) or null if not set or error
   */
  private getHiddenFlagValue(entryId: string): boolean | null {
    try {
      if (typeof game === "undefined" || !game?.journal) return null;

      const entry = game.journal.get(entryId);
      if (!entry) return null;

      // Type guard to check if entry has getFlag method
      if (typeof entry !== "object" || entry === null || !("getFlag" in entry)) {
        return null;
      }

      const getFlagMethod = castCacheValue<(scope: string, key: string) => unknown>(entry.getFlag);
      const hiddenFlag = castCacheValue<boolean | undefined | null>(
        getFlagMethod(MODULE_CONSTANTS.MODULE.ID, MODULE_CONSTANTS.FLAGS.HIDDEN)
      );
      if (hiddenFlag === true || hiddenFlag === false) {
        return hiddenFlag;
      }
      return null;
    } catch (_error) {
      return null;
    }
  }

  /**
   * Extracts journal entry from hook arguments.
   * Foundry hooks pass different argument structures, so we need to handle multiple cases.
   */
  private getEntryFromHookArgs(args: unknown[]): { id: string } | null {
    try {
      // Foundry hooks typically pass: (entry, options, userId, ...)
      // The first argument is usually the document
      if (args.length > 0 && args[0]) {
        const firstArg: unknown = args[0];
        // Could be the entry directly, or an array containing the entry
        if (Array.isArray(firstArg)) {
          const arrayArg: unknown[] = firstArg;
          if (arrayArg.length > 0) {
            const entry = castCacheValue<{ id?: string } | null | undefined>(
              getFirstArrayElement(arrayArg)
            );
            if (entry?.id) return { id: entry.id };
          }
        } else {
          const entry = castCacheValue<{ id?: string } | null | undefined>(firstArg);
          if (entry?.id) {
            return { id: entry.id };
          }
        }
      }
      return null;
    } catch (error) {
      this.notificationCenter.debug(
        "Failed to extract entry from hook args",
        { error: error instanceof Error ? error.message : String(error) },
        { channels: ["ConsoleChannel"] }
      );
      return null;
    }
  }

  /**
   * Triggers a re-render of the journal directory if it's currently open.
   * This ensures that hidden entries are immediately updated after flag changes.
   *
   * Returns true if re-render was triggered, false otherwise.
   */
  private rerenderJournalDirectory(): boolean {
    try {
      // Check if journal directory is open by looking for the HTML element
      const journalElement = document.querySelector("#journal");
      if (!journalElement) {
        // Journal directory not open - that's OK, no need to re-render
        this.notificationCenter.debug(
          "Journal directory not open, skipping re-render",
          {},
          { channels: ["ConsoleChannel"] }
        );
        return false;
      }

      // Journal directory is open - try to find the app and trigger re-render
      if (typeof ui === "undefined" || !ui) {
        this.notificationCenter.debug(
          "UI not available, skipping journal directory re-render",
          {},
          { channels: ["ConsoleChannel"] }
        );
        return false;
      }

      // Try different paths to find the journal directory app in Foundry v13
      const sidebar = castCacheValue<{ tabs?: { journal?: unknown }; journal?: unknown }>(
        ui.sidebar
      );
      const journalApp = castCacheValue<
        | { id?: string; render?: (force?: boolean) => void; constructor?: { name?: string } }
        | null
        | undefined
      >(
        sidebar?.tabs?.journal ||
          sidebar?.journal ||
          castCacheValue<{ journal?: unknown }>(ui).journal ||
          castCacheValue<{ apps?: Array<{ id?: string }> }>(ui).apps?.find(
            (app: { id?: string }) => app.id === "journal"
          )
      );

      if (journalApp && typeof journalApp.render === "function") {
        // Re-render the journal directory
        // This will trigger the renderJournalDirectory hook, which will process hidden entries
        journalApp.render(false); // false = don't force, just re-render

        this.notificationCenter.debug(
          "Triggered journal directory re-render after flag update",
          {
            context: {
              journalAppId: journalApp.id,
              journalAppClass: journalApp.constructor?.name,
            },
          },
          { channels: ["ConsoleChannel"] }
        );
        return true;
      } else {
        // Alternative: Manually trigger the hook with the HTML element
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        if (typeof Hooks !== "undefined" && typeof Hooks.call === "function") {
          // Create a minimal app object for the hook
          const app = castCacheValue<{ id: string; render: () => void }>(
            journalApp || { id: "journal", render: () => {} }
          );
          (Hooks as { call: (hookName: string, ...args: unknown[]) => unknown }).call(
            MODULE_CONSTANTS.HOOKS.RENDER_JOURNAL_DIRECTORY,
            app,
            [journalElement]
          );

          this.notificationCenter.debug(
            "Manually triggered renderJournalDirectory hook",
            { context: { appId: app.id } },
            { channels: ["ConsoleChannel"] }
          );
          return true;
        }

        // Could not trigger re-render
        this.notificationCenter.debug(
          "Could not trigger journal directory re-render (app not found)",
          {
            context: {
              hasUI: !!ui,
              hasSidebar: !!sidebar,
              hasTabs: !!sidebar?.tabs,
              hasJournalTab: !!sidebar?.tabs?.journal,
              hasJournalElement: !!journalElement,
            },
          },
          { channels: ["ConsoleChannel"] }
        );
        return false;
      }
    } catch (error) {
      // Don't throw - re-render is optional, errors shouldn't break the hook
      this.notificationCenter.warn(
        "Failed to re-render journal directory",
        {
          code: "RERENDER_FAILED",
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        },
        { channels: ["ConsoleChannel"] }
      );
      return false;
    }
  }

  dispose(): void {
    this.registrationManager.dispose();
  }
}

export class DIJournalCacheInvalidationHook extends JournalCacheInvalidationHook {
  static dependencies = [
    foundryHooksToken,
    cacheServiceToken,
    notificationCenterToken,
    foundryGameToken,
    journalVisibilityServiceToken,
  ] as const;

  constructor(
    hooks: FoundryHooks,
    cache: CacheService,
    notificationCenter: NotificationCenter,
    foundryGame: FoundryGame,
    journalVisibility: JournalVisibilityService
  ) {
    super(hooks, cache, notificationCenter, foundryGame, journalVisibility);
  }
}
