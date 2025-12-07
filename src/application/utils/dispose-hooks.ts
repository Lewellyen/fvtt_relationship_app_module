import type { EventRegistrar } from "@/application/use-cases/event-registrar.interface";

/**
 * Disposes all hooks in the provided array.
 *
 * This is a lifecycle method that is called when the module is disabled or reloaded.
 * Each hook's dispose() method is called to clean up any registered Foundry hooks.
 *
 * @param hooks - Array of EventRegistrar instances to dispose
 */
export function disposeHooks(hooks: EventRegistrar[]): void {
  for (const hook of hooks) {
    hook.dispose();
  }
}
