import type { Result } from "@/domain/types/result";
import type { InjectionToken } from "../types/core/injectiontoken";
import type { ContainerError } from "../interfaces";
import type { ServiceRegistration } from "../types/core/serviceregistration";
import type { DependencyResolver } from "./dependency-resolver.interface";
import type { ServiceInstantiator } from "./service-instantiation.interface";
import type { InstanceCache } from "../cache/InstanceCache";
import type { LifecycleResolutionStrategy } from "./lifecycle-resolution-strategy.interface";
import { ServiceLifecycle } from "../types/core/servicelifecycle";
import { SingletonResolutionStrategy } from "./strategies/singleton-resolution-strategy";
import { TransientResolutionStrategy } from "./strategies/transient-resolution-strategy";
import { ScopedResolutionStrategy } from "./strategies/scoped-resolution-strategy";
import { err } from "@/domain/utils/result";

/**
 * Resolves services based on their lifecycle using strategy pattern.
 *
 * Responsibilities:
 * - Select appropriate lifecycle strategy
 * - Delegate resolution to strategy
 * - Handle invalid lifecycle errors
 *
 * This class separates lifecycle-specific resolution logic from ServiceResolver,
 * following the Single Responsibility Principle.
 *
 * Uses DependencyResolver and ServiceInstantiator interfaces instead of
 * ServiceResolver to break circular dependencies (Dependency Inversion Principle).
 */
export class LifecycleResolver {
  private readonly strategies = new Map<ServiceLifecycle, LifecycleResolutionStrategy>();

  constructor(
    private readonly cache: InstanceCache,
    private readonly parentResolver: DependencyResolver | null,
    private readonly scopeName: string
  ) {
    // Initialize lifecycle strategies
    this.strategies.set(ServiceLifecycle.SINGLETON, new SingletonResolutionStrategy());
    this.strategies.set(ServiceLifecycle.TRANSIENT, new TransientResolutionStrategy());
    this.strategies.set(ServiceLifecycle.SCOPED, new ScopedResolutionStrategy());
  }

  /**
   * Resolves a service based on its lifecycle.
   *
   * @template T - The type of service to resolve
   * @param token - The injection token identifying the service
   * @param registration - The service registration metadata
   * @param dependencyResolver - The DependencyResolver for dependency resolution
   * @param instantiator - The ServiceInstantiator for service instantiation
   * @returns Result with service instance or error
   */
  resolve<T>(
    token: InjectionToken<T>,
    registration: ServiceRegistration<T>,
    dependencyResolver: DependencyResolver,
    instantiator: ServiceInstantiator
  ): Result<T, ContainerError> {
    const strategy = this.strategies.get(registration.lifecycle);
    if (!strategy) {
      return err({
        code: "InvalidLifecycle",
        message: `Invalid service lifecycle: ${String(registration.lifecycle)}`,
        tokenDescription: String(token),
      });
    }
    return strategy.resolve(
      token,
      registration,
      dependencyResolver,
      instantiator,
      this.cache,
      this.parentResolver,
      this.scopeName
    );
  }
}
