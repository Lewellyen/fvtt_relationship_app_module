import type { Result } from "@/types/result";
import type { FoundryHooks } from "@/foundry/interfaces/FoundryHooks";
import type { FoundryHookCallback } from "@/foundry/types";
import type { FoundryError } from "@/foundry/errors/FoundryErrors";
import type { Disposable } from "@/di_infrastructure/interfaces/disposable";
import { PortSelector } from "@/foundry/versioning/portselector";
import { PortRegistry } from "@/foundry/versioning/portregistry";
import { portSelectorToken, foundryHooksPortRegistryToken } from "@/foundry/foundrytokens";

/**
 * Service wrapper for FoundryHooks that automatically selects the appropriate port
 * based on the current Foundry version.
 *
 * Implements Disposable to clean up registered hooks when the container is disposed.
 */
export class FoundryHooksService implements FoundryHooks, Disposable {
  static dependencies = [portSelectorToken, foundryHooksPortRegistryToken] as const;

  private port: FoundryHooks | null = null;
  private readonly portSelector: PortSelector;
  private readonly portRegistry: PortRegistry<FoundryHooks>;
  private registeredHooks = new Map<string, Map<number, FoundryHookCallback>>();

  constructor(portSelector: PortSelector, portRegistry: PortRegistry<FoundryHooks>) {
    this.portSelector = portSelector;
    this.portRegistry = portRegistry;
  }

  /**
   * Lazy-loads the appropriate port based on Foundry version.
   * Uses PortSelector with factory-based selection to prevent eager instantiation.
   *
   * CRITICAL: This prevents crashes when newer port constructors access
   * APIs not available in the current Foundry version.
   *
   * @returns Result containing the port or a FoundryError if no compatible port can be selected
   */
  private getPort(): Result<FoundryHooks, FoundryError> {
    if (this.port === null) {
      // Get factories (not instances) to avoid eager instantiation
      const factories = this.portRegistry.getFactories();

      // Use PortSelector with factory-based selection
      const portResult = this.portSelector.selectPortFromFactories(factories);
      if (!portResult.ok) {
        return portResult;
      }

      this.port = portResult.value;
    }
    return { ok: true, value: this.port };
  }

  on(hookName: string, callback: FoundryHookCallback): Result<number, FoundryError> {
    const portResult = this.getPort();
    if (!portResult.ok) return portResult;

    const result = portResult.value.on(hookName, callback);

    if (result.ok) {
      // Track registered hook for cleanup
      if (!this.registeredHooks.has(hookName)) {
        this.registeredHooks.set(hookName, new Map());
      }
      this.registeredHooks.get(hookName)!.set(result.value, callback);
    }

    return result;
  }

  once(hookName: string, callback: FoundryHookCallback): Result<number, FoundryError> {
    const portResult = this.getPort();
    if (!portResult.ok) return portResult;
    
    // once() hooks are automatically deregistered by Foundry after firing
    // No tracking needed - they clean themselves up
    return portResult.value.once(hookName, callback);
  }

  off(hookName: string, callbackOrId: FoundryHookCallback | number): Result<void, FoundryError> {
    const portResult = this.getPort();
    if (!portResult.ok) return portResult;

    const result = portResult.value.off(hookName, callbackOrId);

    if (result.ok && typeof callbackOrId === "number") {
      // Remove from tracked hooks
      const hooks = this.registeredHooks.get(hookName);
      if (hooks) {
        hooks.delete(callbackOrId);
      }
    }

    return result;
  }

  /**
   * Cleans up all registered hooks.
   * Called automatically when the container is disposed.
   */
  dispose(): void {
    for (const [hookName, hookMap] of this.registeredHooks) {
      for (const [hookId, callback] of hookMap) {
        try {
          if (typeof Hooks !== "undefined") {
            // Foundry's Hooks.off has strict types - use type assertion for dynamic hook names
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (Hooks as any).off(hookName, callback);
          }
        } catch (error) {
          console.warn(`Failed to unregister hook ${hookName} (ID: ${hookId}):`, error);
        }
      }
    }

    this.registeredHooks.clear();
    this.port = null;
  }
}
