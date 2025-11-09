import type { ServiceContainer } from "@/di_infrastructure/container";
import type { HookRegistrar } from "@/core/hooks/hook-registrar.interface";
import { RenderJournalDirectoryHook } from "@/core/hooks/render-journal-directory-hook";

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
 */
export class ModuleHookRegistrar {
  private hooks: HookRegistrar[] = [
    new RenderJournalDirectoryHook(),
    // Add new hooks here
  ];

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
