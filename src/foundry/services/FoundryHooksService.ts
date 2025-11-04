import type { Result } from "@/types/result";
import type { FoundryHooks } from "@/foundry/interfaces/FoundryHooks";
import type { FoundryHookCallback } from "@/foundry/types";
import type { FoundryError } from "@/foundry/errors/FoundryErrors";
import { PortSelector } from "@/foundry/versioning/portselector";
import { PortRegistry } from "@/foundry/versioning/portregistry";
import { portSelectorToken, foundryHooksPortRegistryToken } from "@/foundry/foundrytokens";

/**
 * Service wrapper for FoundryHooks that automatically selects the appropriate port
 * based on the current Foundry version.
 */
export class FoundryHooksService implements FoundryHooks {
  static dependencies = [portSelectorToken, foundryHooksPortRegistryToken] as const;

  private port: FoundryHooks | null = null;
  private readonly portSelector: PortSelector;
  private readonly portRegistry: PortRegistry<FoundryHooks>;

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
    return portResult.value.on(hookName, callback);
  }

  once(hookName: string, callback: FoundryHookCallback): Result<number, FoundryError> {
    const portResult = this.getPort();
    if (!portResult.ok) return portResult;
    return portResult.value.once(hookName, callback);
  }

  off(hookName: string, callbackOrId: FoundryHookCallback | number): Result<void, FoundryError> {
    const portResult = this.getPort();
    if (!portResult.ok) return portResult;
    return portResult.value.off(hookName, callbackOrId);
  }
}
