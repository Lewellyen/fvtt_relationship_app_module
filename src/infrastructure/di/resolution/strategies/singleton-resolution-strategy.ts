import type { Result } from "@/domain/types/result";
import type { InjectionToken } from "../../types/core/injectiontoken";
import type { ContainerError } from "../../interfaces";
import type { ServiceRegistration } from "../../types/core/serviceregistration";
import type { DependencyResolver } from "../dependency-resolver.interface";
import type { ServiceInstantiator } from "../service-instantiation.interface";
import type { InstanceCache } from "../../cache/InstanceCache";
import type { LifecycleResolutionStrategy } from "../lifecycle-resolution-strategy.interface";
import { ok } from "@/domain/utils/result";
import { castCachedServiceInstanceForResult } from "../../types/utilities/runtime-safe-cast";

/**
 * Resolution strategy for Singleton services.
 *
 * Strategy:
 * 1. Try parent resolver first (for shared parent singletons)
 * 2. If parent returns error:
 *    - CircularDependency → propagate error
 *    - TokenNotRegistered → fallback to own cache (child-specific singleton)
 * 3. Use own cache for root container or child-specific singletons
 */
export class SingletonResolutionStrategy implements LifecycleResolutionStrategy {
  resolve<T>(
    token: InjectionToken<T>,
    registration: ServiceRegistration<T>,
    dependencyResolver: DependencyResolver,
    instantiator: ServiceInstantiator,
    cache: InstanceCache,
    parentResolver: DependencyResolver | null,
    _scopeName: string
  ): Result<T, ContainerError> {
    // Try parent resolver first for shared singletons
    if (parentResolver !== null) {
      const parentResult = parentResolver.resolve(token);

      if (parentResult.ok) {
        // Parent has it - use parent's singleton instance (shared)
        return parentResult;
      }

      // Check error code to determine action
      if (parentResult.error.code === "CircularDependency") {
        // Real circular dependency - propagate as-is
        return parentResult;
      }

      // TokenNotRegistered or other error -> fallback to own cache
      // This allows child-specific singleton registrations
    }

    // Root container OR parent doesn't have it: use own cache
    if (!cache.has(token)) {
      const instanceResult = instantiator.instantiate(token, registration);
      if (!instanceResult.ok) {
        return instanceResult; // Propagate error without wrapping
      }
      cache.set(token, instanceResult.value);
    }

    const instanceResult = castCachedServiceInstanceForResult<T>(cache.get(token));
    if (!instanceResult.ok) {
      return instanceResult; // Propagate error
    }
    return ok(instanceResult.value);
  }
}
