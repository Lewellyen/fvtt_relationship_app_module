import type { Result } from "@/domain/types/result";
import type {
  LibWrapperService,
  LibWrapperFunction,
  LibWrapperType,
  LibWrapperRegistrationId,
  LibWrapperError,
} from "@/domain/services/lib-wrapper-service.interface";
import type { Logger } from "@/infrastructure/logging/logger.interface";
import { loggerToken } from "@/infrastructure/shared/tokens";
import { MODULE_CONSTANTS } from "@/infrastructure/shared/constants";
import { tryCatch } from "@/infrastructure/shared/utils/result";
import { err, ok } from "@/infrastructure/shared/utils/result";

/**
 * Type for libWrapper global (provided by lib-wrapper module in Foundry).
 */
declare global {
  var libWrapper:
    | {
        register: (
          moduleId: string,
          target: string,
          fn: LibWrapperFunction,
          type: LibWrapperType
        ) => void;
        unregister: (moduleId: string, target: string) => void;
      }
    | undefined;
}

/**
 * Foundry-specific implementation of LibWrapperService.
 *
 * Provides a facade over libWrapper that handles registration and unregistration
 * of method wrappers. Tracks all registrations for proper cleanup.
 *
 * @example
 * ```typescript
 * const service = new FoundryLibWrapperService("my-module-id", logger);
 *
 * const result = service.register(
 *   "foundry.applications.ux.ContextMenu.implementation.prototype.render",
 *   (wrapped, ...args) => {
 *     // Custom logic
 *     return wrapped(...args);
 *   },
 *   "WRAPPER"
 * );
 *
 * // Later: Cleanup
 * service.dispose();
 * ```
 */
export class FoundryLibWrapperService implements LibWrapperService {
  private registeredTargets = new Map<string, boolean>();
  private nextId = 1;

  constructor(
    private readonly moduleId: string,
    private readonly logger: Logger
  ) {}

  register(
    target: string,
    wrapperFn: LibWrapperFunction,
    type: LibWrapperType
  ): Result<LibWrapperRegistrationId, LibWrapperError> {
    // Prüfe libWrapper Verfügbarkeit
    if (typeof globalThis.libWrapper === "undefined") {
      return err({
        code: "LIBWRAPPER_NOT_AVAILABLE",
        message: "libWrapper is not available",
      });
    }

    // Prüfe, ob Target bereits registriert ist
    if (this.registeredTargets.has(target)) {
      return err({
        code: "REGISTRATION_FAILED",
        message: `Target "${target}" is already registered`,
        details: { target },
      });
    }

    const result = tryCatch(
      () => {
        const libWrapperInstance = globalThis.libWrapper;
        if (typeof libWrapperInstance === "undefined") {
          throw new Error("libWrapper is not available");
        }

        libWrapperInstance.register(this.moduleId, target, wrapperFn, type);

        // Track registration
        this.registeredTargets.set(target, true);
        const registrationId = this.nextId++;

        return registrationId;
      },
      (error): LibWrapperError => ({
        code: "REGISTRATION_FAILED",
        message: `Failed to register wrapper for target "${target}": ${String(error)}`,
        details: { target, error },
      })
    );

    if (result.ok) {
      return ok(result.value);
    }
    return result;
  }

  unregister(target: string): Result<void, LibWrapperError> {
    // Prüfe, ob Target registriert ist
    if (!this.registeredTargets.has(target)) {
      return err({
        code: "TARGET_NOT_REGISTERED",
        message: `Target "${target}" is not registered`,
        details: { target },
      });
    }

    // Prüfe libWrapper Verfügbarkeit
    if (typeof globalThis.libWrapper === "undefined") {
      return err({
        code: "LIBWRAPPER_NOT_AVAILABLE",
        message: "libWrapper is not available",
      });
    }

    const result = tryCatch(
      () => {
        const libWrapperInstance = globalThis.libWrapper;
        if (typeof libWrapperInstance === "undefined") {
          throw new Error("libWrapper is not available");
        }

        libWrapperInstance.unregister(this.moduleId, target);

        // Remove from tracking
        this.registeredTargets.delete(target);
      },
      (error): LibWrapperError => ({
        code: "UNREGISTRATION_FAILED",
        message: `Failed to unregister wrapper for target "${target}": ${String(error)}`,
        details: { target, error },
      })
    );

    if (result.ok) {
      return ok(undefined);
    }
    return result;
  }

  /**
   * Cleanup all registered wrappers.
   * Should be called during module shutdown.
   */
  dispose(): void {
    // Unregister all tracked targets
    const targets = Array.from(this.registeredTargets.keys());
    for (const target of targets) {
      const result = this.unregister(target);
      if (!result.ok) {
        this.logger.warn("Failed to unregister libWrapper target during dispose", {
          target,
          error: result.error,
        });
      }
    }

    this.registeredTargets.clear();
  }
}

/**
 * DI-enabled wrapper for FoundryLibWrapperService.
 *
 * Uses MODULE_CONSTANTS.MODULE.ID directly, consistent with other services.
 */
export class DIFoundryLibWrapperService extends FoundryLibWrapperService {
  static dependencies = [loggerToken] as const;

  constructor(logger: Logger) {
    super(MODULE_CONSTANTS.MODULE.ID, logger);
  }
}
