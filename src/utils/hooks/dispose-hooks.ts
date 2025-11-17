import type { HookRegistrar } from "@/core/hooks/hook-registrar.interface";

/**
 * Disposes all hooks in the provided array.
 *
 * This is a lifecycle method that is called when the module is disabled or reloaded.
 * Each hook's dispose() method is called to clean up any registered Foundry hooks.
 *
 * @param hooks - Array of HookRegistrar instances to dispose
 */
export function disposeHooks(hooks: HookRegistrar[]): void {
  for (const hook of hooks) {
    hook.dispose();
  }
}
