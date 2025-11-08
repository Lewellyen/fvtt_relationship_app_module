import type { Result } from "@/types/result";
import type { FoundryDocument } from "@/foundry/interfaces/FoundryDocument";
import type { FoundryError } from "@/foundry/errors/FoundryErrors";
import type { Disposable } from "@/di_infrastructure/interfaces/disposable";
import { PortSelector } from "@/foundry/versioning/portselector";
import { PortRegistry } from "@/foundry/versioning/portregistry";
import { portSelectorToken, foundryDocumentPortRegistryToken } from "@/foundry/foundrytokens";

/**
 * Service wrapper for FoundryDocument that automatically selects the appropriate port
 * based on the current Foundry version.
 *
 * Implements Disposable for resource cleanup consistency.
 */
export class FoundryDocumentService implements FoundryDocument, Disposable {
  static dependencies = [portSelectorToken, foundryDocumentPortRegistryToken] as const;

  private port: FoundryDocument | null = null;
  private readonly portSelector: PortSelector;
  private readonly portRegistry: PortRegistry<FoundryDocument>;

  constructor(portSelector: PortSelector, portRegistry: PortRegistry<FoundryDocument>) {
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
  private getPort(): Result<FoundryDocument, FoundryError> {
    if (this.port === null) {
      // Get factories (not instances) to avoid eager instantiation
      const factories = this.portRegistry.getFactories();

      // Use PortSelector with factory-based selection
      const portResult = this.portSelector.selectPortFromFactories(
        factories,
        undefined,
        "FoundryDocument"
      );
      if (!portResult.ok) {
        return portResult;
      }

      this.port = portResult.value;
    }
    return { ok: true, value: this.port };
  }

  getFlag<T = unknown>(
    document: { getFlag: (scope: string, key: string) => unknown },
    scope: string,
    key: string
  ): Result<T | null, FoundryError> {
    const portResult = this.getPort();
    if (!portResult.ok) return portResult;
    return portResult.value.getFlag<T>(document, scope, key);
  }

  async setFlag<T = unknown>(
    document: { setFlag: (scope: string, key: string, value: T) => Promise<unknown> },
    scope: string,
    key: string,
    value: T
  ): Promise<Result<void, FoundryError>> {
    const portResult = this.getPort();
    if (!portResult.ok) return portResult;
    return await portResult.value.setFlag(document, scope, key, value);
  }

  /**
   * Cleans up resources.
   * Resets the port reference to allow garbage collection.
   */
  dispose(): void {
    // Dispose port if it implements Disposable interface
    /* c8 ignore start -- Defensive: Ports do not currently implement dispose(); reserved for future extensions */
    if (this.port && "dispose" in this.port && typeof this.port.dispose === "function") {
      // Double cast narrows from generic ServiceType to Disposable for runtime cleanup
      /* type-coverage:ignore-next-line */
      (this.port as unknown as Disposable).dispose();
    }
    /* c8 ignore stop */
    this.port = null;
  }
}
