import type { Result } from "@/domain/types/result";
import type { InjectionToken } from "../../types/core/injectiontoken";
import type { ContainerError } from "../../interfaces";
import type { ServiceRegistration } from "../../types/core/serviceregistration";
import type { DependencyResolver } from "../dependency-resolver.interface";
import type { ServiceInstantiator } from "../service-instantiation.interface";
import type { InstanceCache } from "../../cache/InstanceCache";
import type { LifecycleResolutionStrategy } from "../lifecycle-resolution-strategy.interface";

/**
 * Resolution strategy for Transient services.
 *
 * Strategy:
 * - Always create new instance (no caching)
 */
export class TransientResolutionStrategy implements LifecycleResolutionStrategy {
  resolve<T>(
    token: InjectionToken<T>,
    registration: ServiceRegistration<T>,
    _dependencyResolver: DependencyResolver,
    instantiator: ServiceInstantiator,
    _cache: InstanceCache,
    _parentResolver: DependencyResolver | null,
    _scopeName: string
  ): Result<T, ContainerError> {
    // Transient services always create new instances
    return instantiator.instantiate(token, registration);
  }
}
