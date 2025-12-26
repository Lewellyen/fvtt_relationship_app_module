/**
 * Service for managing module ready state.
 *
 * Uses PlatformModuleReadyPort to set module.ready = true when bootstrap is complete.
 * Follows the platform port pattern for architecture compliance.
 */

import type { PlatformModuleReadyPort } from "@/domain/ports/platform-module-ready-port.interface";
import type { PlatformLoggingPort } from "@/domain/ports/platform-logging-port.interface";
import { platformModuleReadyPortToken } from "@/application/tokens/domain-ports.tokens";
import { platformLoggingPortToken } from "@/application/tokens/domain-ports.tokens";
import { createInjectionToken } from "@/application/utils/token-factory";
import type { InjectionToken } from "@/application/di/injection-token";

/**
 * Service responsible for managing module.ready state.
 *
 * Uses PlatformModuleReadyPort to set module.ready = true when bootstrap-ready-hook completes.
 * Does NOT set module.ready = false initially - if it's not set, it's undefined/false anyway.
 */
export class ModuleReadyService {
  constructor(
    private readonly moduleReadyPort: PlatformModuleReadyPort,
    private readonly loggingPort: PlatformLoggingPort
  ) {}

  /**
   * Sets module.ready to true (ready state).
   * Should be called when bootstrap-ready-hook completes.
   */
  setReady(): void {
    const result = this.moduleReadyPort.setReady();
    if (!result.ok) {
      this.loggingPort.warn(
        `Failed to set module.ready: ${result.error.message}`,
        result.error.details
      );
    } else {
      this.loggingPort.info("module.ready set to true");
    }
  }
}

/**
 * DI wrapper for ModuleReadyService.
 * Injects dependencies via constructor.
 */
export class DIModuleReadyService extends ModuleReadyService {
  static dependencies = [platformModuleReadyPortToken, platformLoggingPortToken] as const;

  constructor(moduleReadyPort: PlatformModuleReadyPort, loggingPort: PlatformLoggingPort) {
    super(moduleReadyPort, loggingPort);
  }
}

/**
 * Injection token for ModuleReadyService.
 */
export const moduleReadyServiceToken: InjectionToken<ModuleReadyService> =
  createInjectionToken<ModuleReadyService>("ModuleReadyService");
