import type { Logger } from "./logger.interface";
import { ConsoleLoggerService } from "./ConsoleLoggerService";
import type { EnvironmentConfig } from "@/domain/types/environment-config";
import { createRuntimeConfig } from "@/application/services/runtime-config-factory";

/**
 * Logger für die Bootstrap-Phase (vor Container-Validierung).
 *
 * Wird ausschließlich in Komponenten verwendet, die bereits vor `container.validate()`
 * Logging benötigen (z. B. CompositionRoot, configureDependencies).
 */
export class BootstrapLoggerService extends ConsoleLoggerService {
  constructor(env: EnvironmentConfig) {
    super(createRuntimeConfig(env));
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
 * const logger = createBootstrapLogger(ENV);
 * logger.error("Bootstrap error", error);
 * ```
 *
 * @param env - Environment configuration
 * @returns A new Logger instance for bootstrap phase
 */
export function createBootstrapLogger(env: EnvironmentConfig): Logger {
  return new BootstrapLoggerService(env);
}

// BOOTSTRAP_LOGGER removed - use createBootstrapLogger(ENV) instead
// This export was removed to enforce ENV dependency injection
