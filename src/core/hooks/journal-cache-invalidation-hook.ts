import type { Result } from "@/types/result";
import { ok, err } from "@/utils/functional/result";
import type { HookRegistrar } from "./hook-registrar.interface";
import { HookRegistrationManager } from "./hook-registration-manager";
import { MODULE_CONSTANTS } from "@/constants";
import { foundryHooksToken } from "@/foundry/foundrytokens";
import { cacheServiceToken, notificationCenterToken } from "@/tokens/tokenindex";
import type { CacheService } from "@/interfaces/cache";
import type { NotificationCenter } from "@/notifications/NotificationCenter";
import type { FoundryHooks } from "@/foundry/interfaces/FoundryHooks";
import { HIDDEN_JOURNAL_CACHE_TAG } from "@/services/JournalVisibilityService";

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
    private readonly notificationCenter: NotificationCenter
  ) {}

  // container parameter entfernt: HookRegistrar-Implementierung nutzt Container nicht mehr direkt
  register(): Result<void, Error> {
    const { hooks, cache, notificationCenter } = this;

    for (const hookName of JOURNAL_INVALIDATION_HOOKS) {
      const registrationResult = hooks.on(hookName, () => {
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
      });

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

  dispose(): void {
    this.registrationManager.dispose();
  }
}

export class DIJournalCacheInvalidationHook extends JournalCacheInvalidationHook {
  static dependencies = [foundryHooksToken, cacheServiceToken, notificationCenterToken] as const;

  constructor(hooks: FoundryHooks, cache: CacheService, notificationCenter: NotificationCenter) {
    super(hooks, cache, notificationCenter);
  }
}
