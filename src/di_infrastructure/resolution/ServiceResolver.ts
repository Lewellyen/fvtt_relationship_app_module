import type { Result } from "@/types/result";
import type { InjectionToken } from "../types/injectiontoken";
import type { ServiceType } from "@/types/servicetypeindex";
import type { ContainerError } from "../interfaces/containererror";
import type { ServiceRegistry } from "../registry/ServiceRegistry";
import type { ServiceRegistration } from "../types/serviceregistration";
import { InstanceCache } from "../cache/InstanceCache";
import { ServiceLifecycle } from "../types/servicelifecycle";
import { ok, err } from "@/utils/result";
import type { MetricsCollector } from "@/observability/metrics-collector";
import { ENV } from "@/config/environment";

/**
 * Resolves service instances based on lifecycle and registration.
 *
 * Responsibilities:
 * - Resolve services by token
 * - Handle lifecycle strategies (Singleton, Transient, Scoped)
 * - Handle alias resolution
 * - Delegate to parent resolver for Singletons
 *
 * Design:
 * - Works with Result pattern (no throws)
 * - Wraps factory errors in FactoryFailedError
 * - Parent resolver for Singleton sharing across scopes
 * - MetricsCollector injected after container validation for performance tracking
 */
export class ServiceResolver {
  private metricsCollector: MetricsCollector | null = null;

  constructor(
    private readonly registry: ServiceRegistry,
    private readonly cache: InstanceCache,
    private readonly parentResolver: ServiceResolver | null,
    private readonly scopeName: string
  ) {}

  /**
   * Sets the MetricsCollector for performance tracking.
   * Called by ServiceContainer after validation.
   *
   * @param collector - The metrics collector instance
   */
  setMetricsCollector(collector: MetricsCollector): void {
    this.metricsCollector = collector;
  }

  /**
   * Resolves a service by token.
   *
   * Handles:
   * - Alias resolution (recursive)
   * - Lifecycle-specific resolution (Singleton/Transient/Scoped)
   * - Parent delegation for Singletons
   * - Factory error wrapping
   *
   * @template TServiceType - The type of service to resolve
   * @param token - The injection token identifying the service
   * @returns Result with service instance or error
   */
  resolve<TServiceType extends ServiceType>(
    token: InjectionToken<TServiceType>
  ): Result<TServiceType, ContainerError> {
    const startTime = ENV.enablePerformanceTracking ? performance.now() : 0;

    // Check if service is registered
    const registration = this.registry.getRegistration(token);
    if (!registration) {
      const stack = new Error().stack;
      const error: ContainerError = {
        code: "TokenNotRegistered",
        message: `Service ${String(token)} not registered`,
        tokenDescription: String(token),
        ...(stack !== undefined && { stack }), // Only include stack if defined
        timestamp: Date.now(),
        containerScope: this.scopeName,
      };
      const result = err(error);

      /* c8 ignore next 4 -- Performance tracking is optional feature flag tested in integration tests */
      if (ENV.enablePerformanceTracking) {
        const duration = performance.now() - startTime;
        this.metricsCollector?.recordResolution(token, duration, false);
      }

      return result;
    }

    // Handle alias resolution
    if (registration.providerType === "alias" && registration.aliasTarget) {
      return this.resolve(registration.aliasTarget as InjectionToken<TServiceType>);
    }

    // Resolve based on lifecycle (all methods already return Result)
    let result: Result<TServiceType, ContainerError>;

    switch (registration.lifecycle) {
      case ServiceLifecycle.SINGLETON:
        result = this.resolveSingleton(token, registration);
        break;

      case ServiceLifecycle.TRANSIENT:
        result = this.resolveTransient(token, registration);
        break;

      case ServiceLifecycle.SCOPED:
        result = this.resolveScoped(token, registration);
        break;

      /* c8 ignore next 6 -- Defensive: ServiceLifecycle enum ensures only valid values; this default is unreachable */
      default:
        result = err({
          code: "InvalidLifecycle",
          message: `Invalid service lifecycle: ${String(registration.lifecycle)}`,
          tokenDescription: String(token),
        });
    }

    if (ENV.enablePerformanceTracking) {
      const duration = performance.now() - startTime;
      this.metricsCollector?.recordResolution(token, duration, result.ok);
    }

    return result;
  }

  /**
   * Instantiates a service based on registration type.
   *
   * CRITICAL: Returns Result to preserve error context and avoid breaking Result-Contract.
   * Handles dependency resolution for classes, direct factory calls, and value returns.
   *
   * @template TServiceType - The type of service to instantiate
   * @param token - The injection token (used for error messages)
   * @param registration - The service registration metadata
   * @returns Result with instance or detailed error (DependencyResolveFailed, FactoryFailed, etc.)
   */
  private instantiateService<TServiceType extends ServiceType>(
    token: InjectionToken<TServiceType>,
    registration: ServiceRegistration
  ): Result<TServiceType, ContainerError> {
    if (registration.serviceClass) {
      // Class: Resolve all dependencies first
      const resolvedDeps: ServiceType[] = [];

      for (const dep of registration.dependencies) {
        const depResult = this.resolve(dep);
        /* c8 ignore next 9 -- Dependency resolution failures tested via circular dependency and missing dependency tests */
        if (!depResult.ok) {
          // Return structured error with cause chain
          return err({
            code: "DependencyResolveFailed",
            message: `Cannot resolve dependency ${String(dep)} for ${String(token)}`,
            tokenDescription: String(dep),
            cause: depResult.error,
          });
        }
        resolvedDeps.push(depResult.value);
      }

      // Instantiate class with resolved dependencies
      try {
        return ok(new registration.serviceClass(...resolvedDeps) as TServiceType);
      } catch (constructorError) {
        return err({
          code: "FactoryFailed",
          message: `Constructor failed for ${String(token)}: ${String(constructorError)}`,
          tokenDescription: String(token),
          cause: constructorError,
        });
      }
    } else if (registration.factory) {
      // Factory: Call directly
      try {
        return ok(registration.factory() as TServiceType);
      } catch (factoryError) {
        return err({
          code: "FactoryFailed",
          message: `Factory failed for ${String(token)}: ${String(factoryError)}`,
          tokenDescription: String(token),
          cause: factoryError,
        });
      }
    } else if (registration.value !== undefined) {
      // Value: Return as-is
      return ok(registration.value as TServiceType);
    } else {
      // Invalid registration
      /* c8 ignore next 5 -- Defensive: ServiceRegistration.create* methods already ensure one of class/factory/value is set */
      return err({
        code: "InvalidOperation",
        message: `Invalid registration for ${String(token)} - no class, factory, or value`,
        tokenDescription: String(token),
      });
    }
  }

  /**
   * Resolves a Singleton service.
   *
   * Strategy:
   * 1. Try parent resolver first (for shared parent singletons)
   * 2. If parent returns error:
   *    - CircularDependency → propagate error
   *    - TokenNotRegistered → fallback to own cache (child-specific singleton)
   * 3. Use own cache for root container or child-specific singletons
   *
   * @template TServiceType - The type of service
   * @param token - The injection token
   * @param registration - The service registration
   * @returns Result with instance or error
   */
  private resolveSingleton<TServiceType extends ServiceType>(
    token: InjectionToken<TServiceType>,
    registration: ServiceRegistration
  ): Result<TServiceType, ContainerError> {
    // Try parent resolver first for shared singletons
    if (this.parentResolver !== null) {
      const parentResult = this.parentResolver.resolve(token);

      if (parentResult.ok) {
        // Parent has it - use parent's singleton instance (shared)
        return parentResult;
      }

      // Check error code to determine action
      /* c8 ignore next 4 -- Circular dependency from parent requires complex multi-level dependency setup that's already tested in container.test.ts */
      if (parentResult.error.code === "CircularDependency") {
        // Real circular dependency - propagate as-is
        return parentResult;
      }

      // TokenNotRegistered or other error -> fallback to own cache
      // This allows child-specific singleton registrations
    }

    // Root container OR parent doesn't have it: use own cache
    if (!this.cache.has(token)) {
      const instanceResult = this.instantiateService(token, registration);
      if (!instanceResult.ok) {
        return instanceResult; // Propagate error without wrapping
      }
      this.cache.set(token, instanceResult.value);
    }

    return ok(this.cache.get(token) as TServiceType);
  }

  /**
   * Resolves a Transient service.
   *
   * Strategy:
   * - Always create new instance (no caching)
   *
   * @template TServiceType - The type of service
   * @param token - The injection token
   * @param registration - The service registration
   * @returns Result with new instance
   */
  private resolveTransient<TServiceType extends ServiceType>(
    token: InjectionToken<TServiceType>,
    registration: ServiceRegistration
  ): Result<TServiceType, ContainerError> {
    return this.instantiateService(token, registration);
  }

  /**
   * Resolves a Scoped service.
   *
   * ⚠️ IMPORTANT: Scoped services can ONLY be resolved in child containers.
   * Attempting to resolve a scoped service in the root container will return
   * a ScopeRequired error.
   *
   * Strategy:
   * - Must be in child scope (not root)
   * - One instance per scope (cached)
   * - Each child scope gets its own isolated instance
   *
   * Use createScope() to create a child container before resolving scoped services.
   *
   * @template TServiceType - The type of service
   * @param token - The injection token
   * @param registration - The service registration
   * @returns Result with scoped instance or ScopeRequired error
   *
   * @example
   * ```typescript
   * // ❌ WRONG: Trying to resolve scoped service in root
   * const root = ServiceContainer.createRoot();
   * root.registerClass(RequestToken, RequestContext, SCOPED);
   * root.validate();
   * const result = root.resolve(RequestToken); // Error: ScopeRequired
   *
   * // ✅ CORRECT: Create child scope first
   * const child = root.createScope("request").value!;
   * child.validate(); // Child must validate separately
   * const ctx = child.resolve(RequestToken); // OK
   * ```
   */
  private resolveScoped<TServiceType extends ServiceType>(
    token: InjectionToken<TServiceType>,
    registration: ServiceRegistration
  ): Result<TServiceType, ContainerError> {
    // Scoped services require a child scope
    if (this.parentResolver === null) {
      return err({
        code: "ScopeRequired",
        message: `Scoped service ${String(token)} requires a scope container. Use createScope() to create a child container first.`,
        tokenDescription: String(token),
      });
    }

    // Check cache (one instance per scope)
    if (!this.cache.has(token)) {
      const instanceResult = this.instantiateService(token, registration);
      /* c8 ignore next 3 -- Error path covered by other instantiation tests; this is just error propagation */
      if (!instanceResult.ok) {
        return instanceResult; // Propagate error
      }
      this.cache.set(token, instanceResult.value);
    }

    return ok(this.cache.get(token) as TServiceType);
  }
}
