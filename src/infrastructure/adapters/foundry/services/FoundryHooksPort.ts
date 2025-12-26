import type { Result } from "@/domain/types/result";
import type { FoundryHooks } from "../interfaces/FoundryHooks";
import type { FoundryHookCallback } from "../types";
import type { FoundryError } from "../errors/FoundryErrors";
import type { Logger } from "@/infrastructure/logging/logger.interface";
import type { PortSelector } from "../versioning/portselector";
import type { PortRegistry } from "../versioning/portregistry";
import type { RetryService } from "@/infrastructure/retry/RetryService";
import type {
  PlatformEventPort,
  EventRegistrationId,
  PlatformEventError,
} from "@/domain/ports/events/platform-event-port.interface";
import type { Disposable } from "@/infrastructure/di/interfaces";
import { portSelectorToken } from "@/infrastructure/shared/tokens/foundry/port-selector.token";
import { foundryHooksPortRegistryToken } from "@/infrastructure/shared/tokens/foundry/foundry-hooks-port-registry.token";
import { retryServiceToken } from "@/infrastructure/shared/tokens/infrastructure/retry-service.token";
import { loggerToken } from "@/infrastructure/shared/tokens/core/logger.token";
import { PortLoader } from "./PortLoader";
import { RetryableOperation } from "./RetryableOperation";
import { castDisposablePort } from "../runtime-casts";
import { err, ok } from "@/domain/utils/result";

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
 * Port wrapper for FoundryHooks that automatically selects the appropriate version
 * based on the current Foundry version.
 *
 * Uses composition instead of inheritance (PortLoader + RetryableOperation) to follow SRP.
 * This refactoring extracts concerns from FoundryServiceBase for better separation of responsibilities.
 * Implements both FoundryHooks (Foundry-specific) and PlatformEventPort (platform-agnostic).
 */
export class FoundryHooksPort implements FoundryHooks, PlatformEventPort<unknown>, Disposable {
  private readonly portLoader: PortLoader<FoundryHooks>;
  private readonly retryable: RetryableOperation;
  private readonly logger: Logger;
  private registeredHooks = new Map<string, Map<number, FoundryHookCallback>>();
  // Bidirectional mapping: callback function -> array of hook registrations (supports reused callbacks)
  private callbackToIdMap = new Map<FoundryHookCallback, Array<{ hookName: string; id: number }>>();
  // Mapping from registration ID to hook name for unregisterListener()
  private idToHookNameMap = new Map<number, string>();

  constructor(
    portSelector: PortSelector,
    portRegistry: PortRegistry<FoundryHooks>,
    retryService: RetryService,
    logger: Logger
  ) {
    this.portLoader = new PortLoader(portSelector, portRegistry);
    this.retryable = new RetryableOperation(retryService);
    this.logger = logger;
  }

  on(hookName: string, callback: FoundryHookCallback): Result<number, FoundryError> {
    const result = this.retryable.execute(() => {
      const portResult = this.portLoader.loadPort("FoundryHooks");
      if (!portResult.ok) return portResult;
      return portResult.value.on(hookName, callback);
    }, "FoundryHooks.on");

    if (result.ok) {
      // Track registered hook for cleanup (both directions)
      let hookMap = this.registeredHooks.get(hookName);
      if (!hookMap) {
        hookMap = new Map();
        this.registeredHooks.set(hookName, hookMap);
      }
      hookMap.set(result.value, callback);

      // Support multiple registrations of the same callback
      const existing = this.callbackToIdMap.get(callback) || [];
      existing.push({ hookName, id: result.value });
      this.callbackToIdMap.set(callback, existing);

      // Track ID to hook name for unregisterListener()
      this.idToHookNameMap.set(result.value, hookName);
    }

    return result;
  }

  once(hookName: string, callback: FoundryHookCallback): Result<number, FoundryError> {
    // once() hooks are automatically deregistered by Foundry after firing
    // No tracking needed - they clean themselves up
    return this.retryable.execute(() => {
      const portResult = this.portLoader.loadPort("FoundryHooks");
      if (!portResult.ok) return portResult;
      return portResult.value.once(hookName, callback);
    }, "FoundryHooks.once");
  }

  off(hookName: string, callbackOrId: FoundryHookCallback | number): Result<void, FoundryError> {
    const result = this.retryable.execute(() => {
      const portResult = this.portLoader.loadPort("FoundryHooks");
      if (!portResult.ok) return portResult;
      return portResult.value.off(hookName, callbackOrId);
    }, "FoundryHooks.off");

    if (result.ok) {
      // Remove from tracked hooks (handle both ID and callback variants)
      if (typeof callbackOrId === "number") {
        // ID variant: remove by ID
        const hooks = this.registeredHooks.get(hookName);
        if (hooks) {
          const callback = hooks.get(callbackOrId);
          hooks.delete(callbackOrId);
          // Clean up bidirectional mapping - remove only this specific registration
          if (callback) {
            const hookInfos = this.callbackToIdMap.get(callback);
            if (hookInfos) {
              const filtered = hookInfos.filter(
                (info) => !(info.hookName === hookName && info.id === callbackOrId)
              );
              if (filtered.length === 0) {
                this.callbackToIdMap.delete(callback);
              } else {
                this.callbackToIdMap.set(callback, filtered);
              }
            }
          }
          // Remove from ID to hook name mapping
          this.idToHookNameMap.delete(callbackOrId);
        }
      } else {
        // Callback variant: lookup all registrations for this hookName via callbackToIdMap
        const hookInfos = this.callbackToIdMap.get(callbackOrId);
        if (hookInfos) {
          // Find all registrations for this specific hookName
          const matchingInfos = hookInfos.filter((info) => info.hookName === hookName);

          // Remove from registeredHooks
          const hooks = this.registeredHooks.get(hookName);
          if (hooks) {
            for (const info of matchingInfos) {
              hooks.delete(info.id);
            }
          }

          // Update callbackToIdMap - keep registrations for other hooks
          const filtered = hookInfos.filter((info) => info.hookName !== hookName);
          if (filtered.length === 0) {
            this.callbackToIdMap.delete(callbackOrId);
          } else {
            this.callbackToIdMap.set(callbackOrId, filtered);
          }
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
    // Iterate through all callbacks and their registrations
    for (const [callback, hookInfos] of this.callbackToIdMap) {
      for (const info of hookInfos) {
        try {
          if (typeof Hooks !== "undefined") {
            // Type-safe cast for dynamic hook names
            // Foundry's Hooks API supports dynamic hook names, but fvtt-types
            // has strict keyof HookConfig typing that doesn't allow runtime strings
            (Hooks as DynamicHooksApi).off(info.hookName, callback);
          }
        } catch (error) {
          this.logger.warn("Failed to unregister hook", {
            hookName: info.hookName,
            hookId: info.id,
            error,
          });
        }
      }
    }

    this.registeredHooks.clear();
    this.callbackToIdMap.clear();
    this.idToHookNameMap.clear();

    // Dispose port if it implements Disposable, then clear cache
    const port = this.portLoader.getLoadedPort();
    const disposable = castDisposablePort(port);
    if (disposable) {
      disposable.dispose();
    }
    this.portLoader.clearCache();
  }

  // ===== PlatformEventPort Implementation =====

  /**
   * Register a listener for platform events.
   * Delegates to FoundryHooks.on() for Foundry-specific implementation.
   * Wraps the PlatformEventPort callback to receive Foundry hook arguments as an array.
   */
  registerListener(
    eventType: string,
    callback: (event: unknown) => void
  ): Result<EventRegistrationId, PlatformEventError> {
    // Wrap callback: Foundry hooks pass multiple arguments, but PlatformEventPort expects single event
    // We pass the arguments as an array to preserve the original Foundry hook signature
    const foundryCallback: FoundryHookCallback = (...args: unknown[]): void => {
      // Pass arguments as array to PlatformEventPort callback
      callback(args);
    };
    const result = this.on(eventType, foundryCallback);

    if (!result.ok) {
      return err({
        code: "EVENT_REGISTRATION_FAILED",
        message: `Failed to register listener for event "${eventType}": ${result.error.message}`,
        details: result.error,
      });
    }

    return ok(result.value);
  }

  /**
   * Unregister a previously registered listener.
   * Requires mapping from registration ID to hook name.
   */
  unregisterListener(registrationId: EventRegistrationId): Result<void, PlatformEventError> {
    // Convert to number if it's a string
    const id =
      typeof registrationId === "string" ? Number.parseInt(registrationId, 10) : registrationId;

    if (Number.isNaN(id)) {
      return err({
        code: "EVENT_UNREGISTRATION_FAILED",
        message: `Invalid registration ID: ${String(registrationId)}`,
      });
    }

    // Look up hook name from ID
    const hookName = this.idToHookNameMap.get(id);
    if (!hookName) {
      return err({
        code: "EVENT_UNREGISTRATION_FAILED",
        message: `No registration found for ID ${id}`,
      });
    }

    // Use off() with ID
    const result = this.off(hookName, id);
    if (!result.ok) {
      return err({
        code: "EVENT_UNREGISTRATION_FAILED",
        message: `Failed to unregister listener for event "${hookName}": ${result.error.message}`,
        details: result.error,
      });
    }

    return ok(undefined);
  }
}

export class DIFoundryHooksPort extends FoundryHooksPort {
  static dependencies = [
    portSelectorToken,
    foundryHooksPortRegistryToken,
    retryServiceToken,
    loggerToken,
  ] as const;

  constructor(
    portSelector: PortSelector,
    portRegistry: PortRegistry<FoundryHooks>,
    retryService: RetryService,
    logger: Logger
  ) {
    super(portSelector, portRegistry, retryService, logger);
  }
}
