import type { Result } from "@/domain/types/result";
import type {
  PlatformModuleReadyPort,
  PlatformModuleReadyError,
} from "@/domain/ports/platform-module-ready-port.interface";
import type { FoundryModule } from "../interfaces/FoundryModule";
import type { FoundryError } from "../errors/FoundryErrors";
import { createFoundryError } from "../errors/FoundryErrors";
import type { PortSelector } from "../versioning/portselector";
import type { PortRegistry } from "../versioning/portregistry";
import type { RetryService } from "@/infrastructure/retry/RetryService";
import type { Disposable } from "@/infrastructure/di/interfaces";
import { portSelectorToken } from "@/infrastructure/shared/tokens/foundry/port-selector.token";
import { foundryModulePortRegistryToken } from "@/infrastructure/shared/tokens/foundry/foundry-module-port-registry.token";
import { retryServiceToken } from "@/infrastructure/shared/tokens/infrastructure/retry-service.token";
import { moduleIdToken } from "@/infrastructure/shared/tokens/infrastructure/module-id.token";
import { PortLoader } from "./PortLoader";
import { RetryableOperation } from "./RetryableOperation";
import { castDisposablePort } from "../runtime-casts";

/**
 * Port wrapper for FoundryModule that automatically selects the appropriate version
 * based on the current Foundry version.
 *
 * Uses composition instead of inheritance (PortLoader + RetryableOperation) to follow SRP.
 * This refactoring extracts concerns from FoundryServiceBase for better separation of responsibilities.
 */
export class FoundryModuleReadyPort implements PlatformModuleReadyPort, Disposable {
  private readonly portLoader: PortLoader<FoundryModule>;
  private readonly retryable: RetryableOperation;
  private readonly moduleId: string;

  constructor(
    portSelector: PortSelector,
    portRegistry: PortRegistry<FoundryModule>,
    retryService: RetryService,
    moduleId: string
  ) {
    this.portLoader = new PortLoader(portSelector, portRegistry);
    this.retryable = new RetryableOperation(retryService);
    this.moduleId = moduleId;
  }

  setReady(): Result<void, PlatformModuleReadyError> {
    const result = this.retryable.execute(() => {
      const portResult = this.portLoader.loadPort("FoundryModule");
      if (!portResult.ok) {
        return {
          ok: false,
          error: createFoundryError(
            "PORT_SELECTION_FAILED",
            portResult.error.message,
            portResult.error.details
          ),
        } as Result<void, FoundryError>;
      }

      const success = portResult.value.setModuleReady(this.moduleId);
      if (!success) {
        return {
          ok: false,
          error: createFoundryError("OPERATION_FAILED", `Module ${this.moduleId} not found`),
        } as Result<void, FoundryError>;
      }

      return { ok: true, value: undefined };
    }, "FoundryModule.setReady");

    // Map FoundryError to PlatformModuleReadyError
    if (!result.ok) {
      let errorCode: PlatformModuleReadyError["code"];
      if (
        result.error.code === "PORT_SELECTION_FAILED" ||
        result.error.code === "API_NOT_AVAILABLE"
      ) {
        errorCode = "PLATFORM_NOT_AVAILABLE";
      } else if (result.error.code === "OPERATION_FAILED") {
        errorCode = "OPERATION_FAILED";
      } else {
        errorCode = "OPERATION_FAILED";
      }

      return {
        ok: false,
        error: {
          code: errorCode,
          message: result.error.message,
          details: result.error.details,
        },
      };
    }

    return { ok: true, value: undefined };
  }

  /**
   * Cleans up resources.
   * Disposes the port if it implements Disposable, then clears the cache.
   */
  dispose(): void {
    const port = this.portLoader.getLoadedPort();
    const disposable = castDisposablePort(port);
    if (disposable) {
      disposable.dispose();
    }
    this.portLoader.clearCache();
  }
}

/**
 * DI wrapper for FoundryModuleReadyPort.
 * Injects dependencies via constructor.
 */
export class DIFoundryModuleReadyPort extends FoundryModuleReadyPort {
  static dependencies = [
    portSelectorToken,
    foundryModulePortRegistryToken,
    retryServiceToken,
    moduleIdToken,
  ] as const;

  constructor(
    portSelector: PortSelector,
    portRegistry: PortRegistry<FoundryModule>,
    retryService: RetryService,
    moduleId: string
  ) {
    super(portSelector, portRegistry, retryService, moduleId);
  }
}
