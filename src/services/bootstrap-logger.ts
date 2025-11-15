import type { Logger } from "@/interfaces/logger";
import { ConsoleLoggerService } from "@/services/consolelogger";
import { ENV } from "@/config/environment";
import { RuntimeConfigService } from "@/core/runtime-config/runtime-config.service";

/**
 * Logger für die Bootstrap-Phase (vor Container-Validierung).
 *
 * Wird ausschließlich in Komponenten verwendet, die bereits vor `container.validate()`
 * Logging benötigen (z. B. CompositionRoot, configureDependencies).
 */
export class BootstrapLoggerService extends ConsoleLoggerService {
  constructor() {
    super(new RuntimeConfigService(ENV));
  }
}

export const BOOTSTRAP_LOGGER: Logger = new BootstrapLoggerService();
