import type { FoundryHooks } from "@/foundry/interfaces/FoundryHooks";
import type { FoundryHookCallback } from "@/foundry/types";
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
   * @throws Error if no compatible port can be selected
   */
  private getPort(): FoundryHooks {
    if (this.port === null) {
      const ports = this.portRegistry.createAll();
      const result = this.portSelector.selectPort(ports);
      if (!result.ok) {
        throw new Error(`Failed to select FoundryHooks port: ${result.error}`);
      }
      this.port = result.value;
    }
    return this.port;
  }

  on(hookName: string, callback: FoundryHookCallback): void {
    try {
      this.getPort().on(hookName, callback);
    } catch (error) {
      console.error(
        `Failed to register hook ${hookName}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  off(hookName: string, callback: FoundryHookCallback): void {
    try {
      this.getPort().off(hookName, callback);
    } catch (error) {
      console.warn(
        `Failed to unregister hook ${hookName}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
