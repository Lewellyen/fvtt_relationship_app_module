import type { Logger } from "@/domain/ports/logger-port.interface";
import { ConsoleLoggerService } from "./ConsoleLoggerService";
import { ENV } from "@/framework/config/environment";
import { createRuntimeConfig } from "@/application/services/runtime-config-factory";

/**
 * Logger für die Bootstrap-Phase (vor Container-Validierung).
 *
 * Wird ausschließlich in Komponenten verwendet, die bereits vor `container.validate()`
 * Logging benötigen (z. B. CompositionRoot, configureDependencies).
 */
export class BootstrapLoggerService extends ConsoleLoggerService {
  constructor() {
    super(createRuntimeConfig(ENV));
  }
}

/**
 * Factory function for creating a bootstrap logger instance.
 *
 * Follows the Dependency Inversion Principle (DIP) by using a factory function
 * instead of directly exporting a concrete instance.
 *
 * **Usage:**
 * ```typescript
 * import { createBootstrapLogger } from "@/infrastructure/logging/BootstrapLogger";
 *
 * const logger = createBootstrapLogger();
 * logger.error("Bootstrap error", error);
 * ```
 *
 * @returns A new Logger instance for bootstrap phase
 */
export function createBootstrapLogger(): Logger {
  return new BootstrapLoggerService();
}

/**
 * Default bootstrap logger instance.
 *
 * **Note:** For new code, prefer using `createBootstrapLogger()` to follow DIP.
 * This export is maintained for backward compatibility.
 */
export const BOOTSTRAP_LOGGER: Logger = createBootstrapLogger();
