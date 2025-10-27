import { ServiceContainer } from "@/di_infrastructure/container";
import { loggerToken } from "@/tokens/tokenindex";
import { ConsoleLoggerService } from "@/services/consolelogger";
import { ServiceLifecycle } from "@/di_infrastructure/types/servicelifecycle";

/**
 * Configures all dependency injection mappings for the application.
 * This is the central place where tokens are connected to their factories.
 * 
 * @param container - The service container to configure
 * 
 * @example
 * ```typescript
 * const container = new ServiceContainer();
 * configureDependencies(container);
 * const logger = container.resolve(loggerToken);
 * ```
 */
export function configureDependencies(container: ServiceContainer): void {
  container.register(loggerToken, () => new ConsoleLoggerService(), ServiceLifecycle.SINGLETON);
}