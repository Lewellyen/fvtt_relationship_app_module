import type { Result } from "@/types/result";
import type { FoundryHooks } from "@/foundry/interfaces/FoundryHooks";
import type { FoundryHookCallback } from "@/foundry/types";
import { PortSelector } from "@/foundry/versioning/portselector";
import { PortRegistry } from "@/foundry/versioning/portregistry";
import { portSelectorToken, foundryHooksPortRegistryToken } from "@/foundry/foundrytokens";
import { err, tryCatch } from "@/utils/result";
import { getFoundryVersion } from "@/foundry/versioning/versiondetector";

/**
 * Service wrapper for FoundryHooks that automatically selects the appropriate port
 * based on the current Foundry version.
 */
export class FoundryHooksService implements FoundryHooks {
  static dependencies = [portSelectorToken, foundryHooksPortRegistryToken] as const;

  private port: FoundryHooks | null = null;
  private readonly portSelector: PortSelector;
  private readonly portRegistry: PortRegistry<FoundryHooks>;

  constructor(
    portSelector: PortSelector,
    portRegistry: PortRegistry<FoundryHooks>
  ) {
    this.portSelector = portSelector;
    this.portRegistry = portRegistry;
  }

  /**
   * Lazy-loads the appropriate port based on Foundry version.
   * @returns Result containing the port or an error if no compatible port can be selected
   */
  private getPort(): Result<FoundryHooks, string> {
    if (this.port === null) {
      const versionResult = tryCatch(
        () => getFoundryVersion(),
        (e) => `Cannot detect Foundry version: ${e instanceof Error ? e.message : String(e)}`
      );
      if (!versionResult.ok) {
        return err(`Failed to detect Foundry version: ${versionResult.error}`);
      }

      const portResult = this.portRegistry.createForVersion(versionResult.value);
      if (!portResult.ok) {
        return err(`Failed to select FoundryHooks port: ${portResult.error}`);
      }
      this.port = portResult.value;
    }
    return { ok: true, value: this.port };
  }

  on(hookName: string, callback: FoundryHookCallback): Result<void, string> {
    const portResult = this.getPort();
    if (!portResult.ok) return portResult;
    return portResult.value.on(hookName, callback);
  }

  off(hookName: string, callback: FoundryHookCallback): Result<void, string> {
    const portResult = this.getPort();
    if (!portResult.ok) return portResult;
    return portResult.value.off(hookName, callback);
  }
}
