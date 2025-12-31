import type { EnvironmentConfig } from "@/domain/types/environment-config";
import type { ServiceContainer } from "@/infrastructure/di/container";
import { ContainerBootstrapFactory } from "@/infrastructure/di/factory/ContainerBootstrapFactory";

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
 * **Responsibility:** Only container creation coordination.
 * Delegates to ContainerBootstrapFactory for bootstrap dependency creation (SRP).
 *
 * **Design:**
 * This factory acts as a thin wrapper around ContainerBootstrapFactory,
 * maintaining the IContainerFactory interface while delegating bootstrap concerns.
 *
 * @example
 * ```typescript
 * const factory = new ContainerFactory();
 * const container = factory.createRoot(ENV);
 * ```
 */
export class ContainerFactory implements IContainerFactory {
  private readonly bootstrapFactory: ContainerBootstrapFactory;

  /**
   * Creates a new ContainerFactory instance.
   *
   * @param bootstrapFactory - Optional bootstrap factory (defaults to new instance)
   */
  constructor(bootstrapFactory?: ContainerBootstrapFactory) {
    this.bootstrapFactory = bootstrapFactory ?? new ContainerBootstrapFactory();
  }

  /**
   * Creates a root ServiceContainer with the given environment configuration.
   *
   * Delegates to ContainerBootstrapFactory to maintain SRP (bootstrap logic separated).
   *
   * @param env - Environment configuration
   * @returns A new ServiceContainer instance
   */
  createRoot(env: EnvironmentConfig): ServiceContainer {
    return this.bootstrapFactory.createRoot(env);
  }
}
