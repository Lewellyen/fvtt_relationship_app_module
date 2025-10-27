import { ServiceContainer } from "@/di_infrastructure/container";
import { loggerToken } from "@/tokens/tokenindex";
import { ConsoleLoggerService } from "@/services/consolelogger";
import { ServiceLifecycle } from "@/di_infrastructure/types/servicelifecycle";
import { ok, err, isErr } from "@/utils/result";
import type { Result } from "@/types/result";

/**
 * Configures all dependency injection mappings for the application.
 * This is the central place where tokens are connected to their factories.
 *
 * @param container - The service container to configure
 * @returns Result indicating success or configuration errors
 *
 * @example
 * ```typescript
 * const container = new ServiceContainer();
 * const result = configureDependencies(container);
 * if (isOk(result)) {
 *   const resolveResult = container.resolve(loggerToken);
 *   // Handle logger resolution
 * }
 * ```
 */
export function configureDependencies(container: ServiceContainer): Result<void, string> {
  const result = container.register(
    loggerToken,
    () => new ConsoleLoggerService(),
    ServiceLifecycle.SINGLETON
  );

  if (isErr(result)) {
    return err(`Failed to register dependencies: ${result.error}`);
  }

  return ok(undefined);
}
