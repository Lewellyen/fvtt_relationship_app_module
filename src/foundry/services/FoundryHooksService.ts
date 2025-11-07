import type { Result } from "@/types/result";
import type { FoundryHooks } from "@/foundry/interfaces/FoundryHooks";
import type { FoundryHookCallback } from "@/foundry/types";
import type { FoundryError } from "@/foundry/errors/FoundryErrors";
import type { Disposable } from "@/di_infrastructure/interfaces/disposable";
import type { Logger } from "@/interfaces/logger";
import { PortSelector } from "@/foundry/versioning/portselector";
import { PortRegistry } from "@/foundry/versioning/portregistry";
import { portSelectorToken, foundryHooksPortRegistryToken } from "@/foundry/foundrytokens";
import { loggerToken } from "@/tokens/tokenindex";

/**
 * Type-safe interface for Foundry Hooks with dynamic hook names.
 * Allows calling Hooks.off() with runtime-determined hook names without using 'any'.
 */
interface DynamicHooksApi {
  off(hookName: string, callback: (...args: unknown[]) => unknown): void;
  on(hookName: string, callback: (...args: unknown[]) => unknown): number;
  once(hookName: string, callback: (...args: unknown[]) => unknown): number;
}

/**
 * Service wrapper for FoundryHooks that automatically selects the appropriate port
 * based on the current Foundry version.
 *
 * Implements Disposable to clean up registered hooks when the container is disposed.
 */
export class FoundryHooksService implements FoundryHooks, Disposable {
  static dependencies = [portSelectorToken, foundryHooksPortRegistryToken, loggerToken] as const;

  private port: FoundryHooks | null = null;
  private readonly portSelector: PortSelector;
  private readonly portRegistry: PortRegistry<FoundryHooks>;
  private readonly logger: Logger;
  private registeredHooks = new Map<string, Map<number, FoundryHookCallback>>();
  // Bidirectional mapping: callback function -> hook ID (for off() with callback variant)
  private callbackToIdMap = new Map<FoundryHookCallback, { hookName: string; id: number }>();

  constructor(
    portSelector: PortSelector,
    portRegistry: PortRegistry<FoundryHooks>,
    logger: Logger
  ) {
    this.portSelector = portSelector;
    this.portRegistry = portRegistry;
    this.logger = logger;
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
      // Track registered hook for cleanup (both directions)
      if (!this.registeredHooks.has(hookName)) {
        this.registeredHooks.set(hookName, new Map());
      }
      // Hook map is created above when missing; bang assertion is safe
      /* type-coverage:ignore-next-line */
      this.registeredHooks.get(hookName)!.set(result.value, callback);
      this.callbackToIdMap.set(callback, { hookName, id: result.value });
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

    if (result.ok) {
      // Remove from tracked hooks (handle both ID and callback variants)
      if (typeof callbackOrId === "number") {
        // ID variant: remove by ID
        const hooks = this.registeredHooks.get(hookName);
        if (hooks) {
          const callback = hooks.get(callbackOrId);
          hooks.delete(callbackOrId);
          // Clean up bidirectional mapping
          if (callback) {
            this.callbackToIdMap.delete(callback);
          }
        }
      } else {
        // Callback variant: lookup ID via callbackToIdMap
        const hookInfo = this.callbackToIdMap.get(callbackOrId);
        if (hookInfo) {
          const hooks = this.registeredHooks.get(hookInfo.hookName);
          if (hooks) {
            hooks.delete(hookInfo.id);
          }
          this.callbackToIdMap.delete(callbackOrId);
        }
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
            // Type-safe cast for dynamic hook names
            // Foundry's Hooks API supports dynamic hook names, but fvtt-types
            // has strict keyof HookConfig typing that doesn't allow runtime strings
            (Hooks as DynamicHooksApi).off(hookName, callback);
          }
        } catch (error) {
          this.logger.warn("Failed to unregister hook", { hookName, hookId, error });
        }
      }
    }

    this.registeredHooks.clear();
    this.callbackToIdMap.clear();
    this.port = null;
  }
}
