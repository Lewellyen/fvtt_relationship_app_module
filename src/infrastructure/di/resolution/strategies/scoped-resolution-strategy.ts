import type { Result } from "@/domain/types/result";
import type { InjectionToken } from "../../types/core/injectiontoken";
import type { ContainerError } from "../../interfaces";
import type { ServiceRegistration } from "../../types/core/serviceregistration";
import type { DependencyResolver } from "../dependency-resolver.interface";
import type { ServiceInstantiator } from "../service-instantiation.interface";
import type { InstanceCache } from "../../cache/InstanceCache";
import type { LifecycleResolutionStrategy } from "../lifecycle-resolution-strategy.interface";
import { ok, err } from "@/domain/utils/result";
import { castCachedServiceInstanceForResult } from "../../types/utilities/runtime-safe-cast";

/**
 * Resolution strategy for Scoped services.
 *
 * ⚠️ IMPORTANT: Scoped services can ONLY be resolved in child containers.
 * Attempting to resolve a scoped service in the root container will return
 * a ScopeRequired error.
 *
 * Strategy:
 * - Must be in child scope (not root)
 * - One instance per scope (cached)
 * - Each child scope gets its own isolated instance
 */
export class ScopedResolutionStrategy implements LifecycleResolutionStrategy {
  resolve<T>(
    token: InjectionToken<T>,
    registration: ServiceRegistration<T>,
    _dependencyResolver: DependencyResolver,
    instantiator: ServiceInstantiator,
    cache: InstanceCache,
    parentResolver: DependencyResolver | null,
    _scopeName: string
  ): Result<T, ContainerError> {
    // Scoped services require a child scope
    if (parentResolver === null) {
      return err({
        code: "ScopeRequired",
        message: `Scoped service ${String(token)} requires a scope container. Use createScope() to create a child container first.`,
        tokenDescription: String(token),
      });
    }

    // Check cache (one instance per scope)
    if (!cache.has(token)) {
      const instanceResult = instantiator.instantiate(token, registration);
      if (!instanceResult.ok) {
        return instanceResult; // Propagate error
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
