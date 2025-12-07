import type { Result } from "@/domain/types/result";
import type { InjectionToken } from "../types/core/injectiontoken";
import type { ContainerError } from "../interfaces";
import type { ServiceRegistration } from "../types/core/serviceregistration";
import type { DependencyResolver } from "./dependency-resolver.interface";
import type { ServiceInstantiator } from "./service-instantiation.interface";
import type { InstanceCache } from "../cache/InstanceCache";

/**
 * Strategy interface for resolving services based on their lifecycle.
 *
 * Each lifecycle (Singleton, Transient, Scoped) has its own resolution strategy
 * that determines how service instances are created, cached, and shared.
 *
 * This interface enables the Strategy Pattern, allowing lifecycle-specific
 * resolution logic to be extracted from ServiceResolver.
 *
 * Uses DependencyResolver and ServiceInstantiator interfaces instead of
 * ServiceResolver to break circular dependencies (Dependency Inversion Principle).
 */
export interface LifecycleResolutionStrategy {
  /**
   * Resolves a service instance based on the lifecycle strategy.
   *
   * @template T - The type of service to resolve
   * @param token - The injection token identifying the service
   * @param registration - The service registration metadata
   * @param dependencyResolver - The DependencyResolver for dependency resolution
   * @param instantiator - The ServiceInstantiator for service instantiation
   * @param cache - The instance cache for storing resolved instances
   * @param parentResolver - The parent resolver for singleton delegation (null for root)
   * @param scopeName - The name of the current scope
   * @returns Result with service instance or error
   */
  resolve<T>(
    token: InjectionToken<T>,
    registration: ServiceRegistration<T>,
    dependencyResolver: DependencyResolver,
    instantiator: ServiceInstantiator,
    cache: InstanceCache,
    parentResolver: DependencyResolver | null,
    scopeName: string
  ): Result<T, ContainerError>;
}
