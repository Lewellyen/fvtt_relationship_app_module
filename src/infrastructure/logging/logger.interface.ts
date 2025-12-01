import type { LogLevel } from "@/domain/types/log-level";
import type { LoggingPort } from "@/domain/ports/logging-port.interface";

/**
 * Logging interface for dependency injection.
 * Provides structured logging methods for different severity levels.
 *
 * This interface extends the domain layer LoggingPort to maintain backward compatibility
 * with existing infrastructure code while following Clean Architecture principles.
 *
 * All methods accept optional additional parameters which will be passed
 * to the console for rich object inspection in the browser's developer tools.
 *
 * @interface Logger
 *
 * @example
 * ```typescript
 * const logger: Logger = container.resolve(loggerToken);
 * logger.setMinLevel(LogLevel.INFO);
 * logger.info("Application started");
 * logger.error("An error occurred", error);
 * logger.debug("User data:", user, { additional: "context" });
 * ```
 */
export interface Logger extends LoggingPort {
  // All methods are inherited from LoggingPort
  // This interface exists for backward compatibility with infrastructure code
}
