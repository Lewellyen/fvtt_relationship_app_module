import type { Result } from "@/domain/types/result";
import type { ServiceContainer } from "@/infrastructure/di/container";
import { configureDependencies } from "@/framework/config/dependencyconfig";

/**
 * Interface for dependency configurator.
 * Responsible for configuring dependencies in a ServiceContainer.
 */
export interface IDependencyConfigurator {
  /**
   * Configures all dependencies in the given container.
   *
   * @param container - The service container to configure
   * @returns Result indicating success or configuration errors
   */
  configure(container: ServiceContainer): Result<void, string>;
}

/**
 * Configurator for setting up dependency injection mappings.
 *
 * **Responsibility:** Only dependency configuration.
 * Delegates to configureDependencies() for actual implementation.
 *
 * @example
 * ```typescript
 * const configurator = new DependencyConfigurator();
 * const result = configurator.configure(container);
 * if (!result.ok) {
 *   console.error(result.error);
 * }
 * ```
 */
export class DependencyConfigurator implements IDependencyConfigurator {
  /**
   * Configures all dependencies in the given container.
   *
   * @param container - The service container to configure
   * @returns Result indicating success or configuration errors
   */
  configure(container: ServiceContainer): Result<void, string> {
    return configureDependencies(container);
  }
}
