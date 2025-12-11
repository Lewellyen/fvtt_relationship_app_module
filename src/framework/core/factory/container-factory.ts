import type { EnvironmentConfig } from "@/domain/types/environment-config";
import type { ServiceContainer } from "@/infrastructure/di/container";
import { ServiceContainer as ServiceContainerImpl } from "@/infrastructure/di/container";

/**
 * Interface for container factory.
 * Responsible for creating ServiceContainer instances.
 */
export interface IContainerFactory {
  /**
   * Creates a root ServiceContainer with the given environment configuration.
   *
   * @param env - Environment configuration
   * @returns A new ServiceContainer instance
   */
  createRoot(env: EnvironmentConfig): ServiceContainer;
}

/**
 * Factory for creating ServiceContainer instances.
 *
 * **Responsibility:** Only container creation.
 * Delegates to ServiceContainer.createRoot() for actual implementation.
 *
 * @example
 * ```typescript
 * const factory = new ContainerFactory();
 * const container = factory.createRoot(ENV);
 * ```
 */
export class ContainerFactory implements IContainerFactory {
  /**
   * Creates a root ServiceContainer with the given environment configuration.
   *
   * @param env - Environment configuration
   * @returns A new ServiceContainer instance
   */
  createRoot(env: EnvironmentConfig): ServiceContainer {
    return ServiceContainerImpl.createRoot(env);
  }
}
