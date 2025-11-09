import type { ServiceContainer } from "@/di_infrastructure/container";
import type { HookRegistrar } from "@/core/hooks/hook-registrar.interface";
import { renderJournalDirectoryHookToken } from "@/tokens/tokenindex";

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
  static dependencies = [renderJournalDirectoryHookToken] as const;

  private hooks: HookRegistrar[];

  constructor(renderJournalHook: HookRegistrar) {
    this.hooks = [
      renderJournalHook,
      // Add new hooks here as constructor parameters
    ];
  }

  /**
   * Registers all hooks with Foundry VTT.
   * @param container - DI container with registered services
   */
  registerAll(container: ServiceContainer): void {
    for (const hook of this.hooks) {
      const result = hook.register(container);
      if (!result.ok) {
        console.error(`Failed to register hook: ${result.error.message}`);
      }
    }
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
