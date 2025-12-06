/**
 * Service for managing module ready state.
 *
 * Uses PlatformModuleReadyPort to set module.ready = true when bootstrap is complete.
 * Follows the platform port pattern for architecture compliance.
 */

import type { PlatformModuleReadyPort } from "@/domain/ports/platform-module-ready-port.interface";
import type { Logger } from "@/infrastructure/logging/logger.interface";
import { platformModuleReadyPortToken } from "@/infrastructure/shared/tokens/ports.tokens";
import { loggerToken } from "@/infrastructure/shared/tokens/core.tokens";
import { createInjectionToken } from "@/infrastructure/di/token-factory";
import type { InjectionToken } from "@/infrastructure/di/types/core/injectiontoken";

/**
 * Service responsible for managing module.ready state.
 *
 * Uses PlatformModuleReadyPort to set module.ready = true when bootstrap-ready-hook completes.
 * Does NOT set module.ready = false initially - if it's not set, it's undefined/false anyway.
 */
export class ModuleReadyService {
  constructor(
    private readonly moduleReadyPort: PlatformModuleReadyPort,
    private readonly logger: Logger
  ) {}

  /**
   * Sets module.ready to true (ready state).
   * Should be called when bootstrap-ready-hook completes.
   */
  setReady(): void {
    const result = this.moduleReadyPort.setReady();
    if (!result.ok) {
      this.logger.warn(`Failed to set module.ready: ${result.error.message}`, result.error.details);
    } else {
      this.logger.info("module.ready set to true");
    }
  }
}

/**
 * DI wrapper for ModuleReadyService.
 * Injects dependencies via constructor.
 */
export class DIModuleReadyService extends ModuleReadyService {
  static dependencies = [platformModuleReadyPortToken, loggerToken] as const;

  constructor(moduleReadyPort: PlatformModuleReadyPort, logger: Logger) {
    super(moduleReadyPort, logger);
  }
}

/**
 * Injection token for ModuleReadyService.
 */
export const moduleReadyServiceToken: InjectionToken<ModuleReadyService> =
  createInjectionToken<ModuleReadyService>("ModuleReadyService");
