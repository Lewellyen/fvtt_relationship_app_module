/**
 * Abstract base class for Foundry service wrappers.
 *
 * Provides:
 * - Common lazy-loading logic for port selection
 * - Retry capability for transient Foundry API failures
 * - Consistent cleanup via Disposable
 *
 * WHY RETRY FOR FOUNDRY API?
 * Foundry VTT APIs can have transient failures:
 * - Race conditions (game.journal not yet initialized)
 * - Timing issues (DOM not ready, settings not loaded)
 * - Port selection failures (version detection glitches)
 *
 * A single retry (maxAttempts: 2) catches 90% of transient errors
 * without performance impact.
 *
 * @template TPort - The port interface type (e.g., FoundryGame, FoundryHooks)
 */

import type { Result } from "@/types/result";
import type { FoundryError } from "@/foundry/errors/FoundryErrors";
import type { Disposable } from "@/di_infrastructure/interfaces/disposable";
import type { PortSelector } from "@/foundry/versioning/portselector";
import type { PortRegistry } from "@/foundry/versioning/portregistry";
import type { RetryService } from "@/services/RetryService";

export abstract class FoundryServiceBase<TPort> implements Disposable {
  protected port: TPort | null = null;
  protected readonly portSelector: PortSelector;
  protected readonly portRegistry: PortRegistry<TPort>;
  protected readonly retryService: RetryService;

  constructor(
    portSelector: PortSelector,
    portRegistry: PortRegistry<TPort>,
    retryService: RetryService
  ) {
    this.portSelector = portSelector;
    this.portRegistry = portRegistry;
    this.retryService = retryService;
  }

  /**
   * Lazy-loads the appropriate port based on Foundry version.
   * Uses PortSelector with factory-based selection to prevent eager instantiation.
   *
   * CRITICAL: This prevents crashes when newer port constructors access
   * APIs not available in the current Foundry version.
   *
   * @param adapterName - Name for logging purposes (e.g., "FoundryGame")
   * @returns Result containing the port or a FoundryError if no compatible port can be selected
   */
  protected getPort(adapterName: string): Result<TPort, FoundryError> {
    if (this.port === null) {
      const factories = this.portRegistry.getFactories();
      const portResult = this.portSelector.selectPortFromFactories(
        factories,
        undefined,
        adapterName
      );
      if (!portResult.ok) {
        return portResult;
      }
      this.port = portResult.value;
    }
    return { ok: true, value: this.port };
  }

  /**
   * Executes a Foundry API operation with automatic retry on transient failures.
   *
   * Use this for any port method call to handle:
   * - Race conditions (Foundry not fully initialized)
   * - Timing issues (DOM/Settings not ready)
   * - Transient port selection failures
   *
   * @template T - The success type
   * @param fn - Function to execute (should call port methods)
   * @param operationName - Operation name for logging (e.g., "FoundryGame.getJournalEntries")
   * @param maxAttempts - Max retry attempts (default: 2 = 1 retry)
   * @returns Result from operation or mapped error
   *
   * @example
   * ```typescript
   * getJournalEntries(): Result<Entry[], FoundryError> {
   *   return this.withRetry(
   *     () => {
   *       const portResult = this.getPort("FoundryGame");
   *       if (!portResult.ok) return portResult;
   *       return portResult.value.getJournalEntries();
   *     },
   *     "FoundryGame.getJournalEntries"
   *   );
   * }
   * ```
   */
  protected withRetry<T>(
    fn: () => Result<T, FoundryError>,
    operationName: string,
    maxAttempts: number = 2
  ): Result<T, FoundryError> {
    return this.retryService.retrySync(fn, {
      maxAttempts,
      operationName,
      mapException: (error) => ({
        code: "OPERATION_FAILED" as const,
        message: `${operationName} failed: ${String(error)}`,
        cause: error instanceof Error ? error : undefined,
      }),
    });
  }

  /**
   * Async variant of withRetry for async operations.
   *
   * @template T - The success type
   * @param fn - Async function to execute
   * @param operationName - Operation name for logging
   * @param maxAttempts - Max retry attempts (default: 2)
   * @returns Promise resolving to Result
   *
   * @example
   * ```typescript
   * async setFlag<T>(doc, scope, key, value): Promise<Result<void, FoundryError>> {
   *   return this.withRetryAsync(
   *     async () => {
   *       const portResult = this.getPort("FoundryDocument");
   *       if (!portResult.ok) return portResult;
   *       return await portResult.value.setFlag(doc, scope, key, value);
   *     },
   *     "FoundryDocument.setFlag"
   *   );
   * }
   * ```
   */
  protected async withRetryAsync<T>(
    fn: () => Promise<Result<T, FoundryError>>,
    operationName: string,
    maxAttempts: number = 2
  ): Promise<Result<T, FoundryError>> {
    return this.retryService.retry(fn, {
      maxAttempts,
      delayMs: 100, // 100ms delay between retries
      operationName,
      mapException: (error) => ({
        code: "OPERATION_FAILED" as const,
        message: `${operationName} failed: ${String(error)}`,
        cause: error instanceof Error ? error : undefined,
      }),
    });
  }

  /**
   * Cleans up resources.
   * Disposes the port if it implements Disposable, then resets the reference.
   * All ports now implement dispose() with #disposed state guards.
   */
  dispose(): void {
    // Dispose port if it implements Disposable interface
    if (
      this.port &&
      typeof this.port === "object" &&
      "dispose" in this.port &&
      typeof this.port.dispose === "function"
    ) {
      /* type-coverage:ignore-next-line -- Type narrowing: Double cast narrows from generic ServiceType to Disposable at runtime */
      (this.port as unknown as Disposable).dispose();
    }
    this.port = null;
  }
}
