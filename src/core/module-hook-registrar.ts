import type { ServiceContainer } from "@/di_infrastructure/container";
import type { HookRegistrar } from "@/core/hooks/hook-registrar.interface";
import type { NotificationCenter } from "@/notifications/NotificationCenter";
import type { Result } from "@/types/result";
import { ok, err } from "@/utils/functional/result";
import {
  renderJournalDirectoryHookToken,
  notificationCenterToken,
  journalCacheInvalidationHookToken,
} from "@/tokens/tokenindex";

/**
 * ModuleHookRegistrar
 *
 * Manages registration of all Foundry hooks using Strategy Pattern.
 * Each hook is implemented as a separate HookRegistrar class.
 *
 * **Design Benefits:**
 * - Easy to add new hooks without modifying this class
 * - Each hook can be tested in isolation
 * - Clear separation of concerns
 * - Full DI architecture: Hooks injected as dependencies
 */
export class ModuleHookRegistrar {
  private hooks: HookRegistrar[];

  constructor(
    renderJournalHook: HookRegistrar,
    journalCacheInvalidationHook: HookRegistrar,
    private readonly notificationCenter: NotificationCenter
  ) {
    this.hooks = [renderJournalHook, journalCacheInvalidationHook];
  }

  /**
   * Registers all hooks with Foundry VTT.
   * @param container - DI container with registered services
   */
  registerAll(container: ServiceContainer): Result<void, Error[]> {
    const errors: Error[] = [];

    for (const hook of this.hooks) {
      const result = hook.register(container);
      if (!result.ok) {
        // Convert string error to structured format
        const error = {
          code: "HOOK_REGISTRATION_FAILED" as const,
          message: result.error.message,
        };
        // Bootstrap error - log to console only (no UI notification)
        this.notificationCenter.error("Failed to register hook", error, {
          channels: ["ConsoleChannel"],
        });
        errors.push(result.error);
      }
    }

    if (errors.length > 0) {
      return err(errors);
    }

    return ok(undefined);
  }

  /**
   * Dispose all hooks.
   * Called when the module is disabled or reloaded.
   */
  /* c8 ignore start -- Lifecycle method: Called when module is disabled; not testable in unit tests */
  disposeAll(): void {
    for (const hook of this.hooks) {
      hook.dispose();
    }
  }
  /* c8 ignore stop */
}

export class DIModuleHookRegistrar extends ModuleHookRegistrar {
  static dependencies = [
    renderJournalDirectoryHookToken,
    journalCacheInvalidationHookToken,
    notificationCenterToken,
  ] as const;

  constructor(
    renderJournalHook: HookRegistrar,
    journalCacheInvalidationHook: HookRegistrar,
    notificationCenter: NotificationCenter
  ) {
    super(renderJournalHook, journalCacheInvalidationHook, notificationCenter);
  }
}
