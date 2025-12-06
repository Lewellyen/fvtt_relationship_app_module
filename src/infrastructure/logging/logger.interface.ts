import type { PlatformLoggingPort } from "@/domain/ports/platform-logging-port.interface";

/**
 * Logger type alias for the infrastructure layer.
 * Provides structured logging methods for different severity levels.
 *
 * This is a type alias for PlatformLoggingPort to maintain backward compatibility
 * with existing infrastructure code while following Clean Architecture principles.
 * The infrastructure layer uses this type, while the application and domain layers
 * use PlatformLoggingPort directly.
 *
 * All methods accept optional additional parameters which will be passed
 * to the console for rich object inspection in the browser's developer tools.
 *
 * @example
 * ```typescript
 * const logger: Logger = container.resolve(loggerToken);
 * logger.setMinLevel?.(LogLevel.INFO);
 * logger.info("Application started");
 * logger.error("An error occurred", error);
 * logger.debug("User data:", user, { additional: "context" });
 * ```
 */
export type Logger = PlatformLoggingPort;
