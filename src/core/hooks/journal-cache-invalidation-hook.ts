import type { Result } from "@/types/result";
import { ok, err } from "@/utils/functional/result";
import type { ServiceContainer } from "@/di_infrastructure/container";
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

  register(container: ServiceContainer): Result<void, Error> {
    const hooksResult = container.resolveWithError<FoundryHooks>(foundryHooksToken);
    const cacheResult = container.resolveWithError<CacheService>(cacheServiceToken);
    const notificationCenterResult =
      container.resolveWithError<NotificationCenter>(notificationCenterToken);

    /* c8 ignore start -- Defensive: Service resolution can only fail if container misconfigured */
    if (!hooksResult.ok || !cacheResult.ok || !notificationCenterResult.ok) {
      if (notificationCenterResult.ok) {
        notificationCenterResult.value.error(
          "DI resolution failed in JournalCacheInvalidationHook",
          {
            code: "DI_RESOLUTION_FAILED",
            message: "Required services for JournalCacheInvalidationHook are missing",
            details: {
              hooksResolved: hooksResult.ok,
              cacheResolved: cacheResult.ok,
            },
          },
          { channels: ["ConsoleChannel"] }
        );
      } else {
        console.error("Failed to resolve NotificationCenter for JournalCacheInvalidationHook");
      }
      return err(new Error("Failed to resolve required services for JournalCacheInvalidationHook"));
    }
    /* c8 ignore stop */

    const hooks = hooksResult.value;
    const cache = cacheResult.value;
    const notificationCenter = notificationCenterResult.value;

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
  static dependencies = [] as const;

  constructor() {
    super();
  }
}
