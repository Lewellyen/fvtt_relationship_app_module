import type { InjectionToken } from "./types/injectiontoken";
import type { FactoryFunction } from "./types/servicefactory";
import type { ServiceClass } from "./types/serviceclass";
import type { ServiceDependencies } from "./types/servicedependencies";
import type { ContainerValidationState } from "./types/containervalidationstate";
import { ServiceLifecycle } from "@/di_infrastructure/types/servicelifecycle";
import type { ServiceType } from "@/types/servicetypeindex";
import { ok, err, isOk } from "@/utils/result";
import type { Result } from "@/types/result";
import type { Container } from "@/di_infrastructure/interfaces/container";
import type { ContainerError } from "@/di_infrastructure/interfaces/containererror";
import { ServiceRegistry } from "./registry/ServiceRegistry";
import { ContainerValidator } from "./validation/ContainerValidator";
import { InstanceCache } from "./cache/InstanceCache";
import { ServiceResolver } from "./resolution/ServiceResolver";
import { ScopeManager } from "./scope/ScopeManager";

/**
 * Fallback factory function type for creating service instances when container resolution fails.
 */
type FallbackFactory<T extends ServiceType> = () => T;

/**
 * Dependency injection container (Facade pattern).
 *
 * Delegates to specialized components:
 * - ServiceRegistry: manages registrations
 * - ContainerValidator: validates dependencies
 * - InstanceCache: caches instances
 * - ServiceResolver: resolves services
 * - ScopeManager: manages lifecycle and disposal
 *
 * **Scope Chain Behavior:**
 * When a parent container is disposed, all child containers are automatically disposed.
 * This ensures proper cleanup of resources across the container hierarchy.
 *
 * **Architecture:**
 * This is a Facade that coordinates specialized components, adhering to Single Responsibility Principle.
 * Each component has a focused responsibility, making the system testable and maintainable.
 *
 * @example
 * ```typescript
 * // Basic usage
 * const container = ServiceContainer.createRoot();
 * container.registerClass(LoggerToken, Logger, ServiceLifecycle.SINGLETON);
 * container.validate();
 * const logger = container.resolve(LoggerToken);
 * ```
 *
 * @example
 * ```typescript
 * // Scope chain with cascading disposal
 * const root = ServiceContainer.createRoot();
 * root.validate();
 * const child1 = root.createScope("child1").value!;
 * const child2 = root.createScope("child2").value!;
 *
 * // Disposing root automatically disposes all children
 * root.dispose();
 * ```
 */
export class ServiceContainer implements Container {
  private registry: ServiceRegistry;
  private validator: ContainerValidator;
  private cache: InstanceCache;
  private resolver: ServiceResolver;
  private scopeManager: ScopeManager;
  private validationState: ContainerValidationState;
  private fallbackFactories = new Map<symbol, FallbackFactory<ServiceType>>();
  private validationPromise: Promise<Result<void, ContainerError[]>> | null = null;

  /**
   * Private constructor - use ServiceContainer.createRoot() instead.
   *
   * This constructor is private to:
   * - Enforce factory pattern usage
   * - Prevent constructor throws (Result-Contract-breaking)
   * - Make child creation explicit through createScope()
   *
   * @param registry - Service registry
   * @param validator - Container validator (shared for parent/child)
   * @param cache - Instance cache
   * @param resolver - Service resolver
   * @param scopeManager - Scope manager
   * @param validationState - Initial validation state
   */
  private constructor(
    registry: ServiceRegistry,
    validator: ContainerValidator,
    cache: InstanceCache,
    resolver: ServiceResolver,
    scopeManager: ScopeManager,
    validationState: ContainerValidationState
  ) {
    this.registry = registry;
    this.validator = validator;
    this.cache = cache;
    this.resolver = resolver;
    this.scopeManager = scopeManager;
    this.validationState = validationState;
  }

  /**
   * Creates a new root container.
   *
   * This is the preferred way to create containers.
   * All components are created fresh for the root container.
   *
   * @returns A new root ServiceContainer
   *
   * @example
   * ```typescript
   * const container = ServiceContainer.createRoot();
   * container.registerClass(LoggerToken, Logger, SINGLETON);
   * container.validate();
   * ```
   */
  static createRoot(): ServiceContainer {
    const registry = new ServiceRegistry();
    const validator = new ContainerValidator();
    const cache = new InstanceCache();
    const scopeManager = new ScopeManager("root", null, cache);
    const resolver = new ServiceResolver(registry, cache, null, "root");

    return new ServiceContainer(registry, validator, cache, resolver, scopeManager, "registering");
  }

  /**
   * Register a service class with automatic dependency injection.
   */
  registerClass<TServiceType extends ServiceType>(
    token: InjectionToken<TServiceType>,
    serviceClass: ServiceClass<TServiceType>,
    lifecycle: ServiceLifecycle
  ): Result<void, ContainerError> {
    if (this.scopeManager.isDisposed()) {
      return err({
        code: "Disposed",
        message: `Cannot register service on disposed container`,
        tokenDescription: String(token),
      });
    }

    if (this.validationState === "validated") {
      return err({
        code: "InvalidOperation",
        message: "Cannot register after validation",
      });
    }

    return this.registry.registerClass(token, serviceClass, lifecycle);
  }

  /**
   * Register a factory function.
   */
  registerFactory<TServiceType extends ServiceType>(
    token: InjectionToken<TServiceType>,
    factory: FactoryFunction<TServiceType>,
    lifecycle: ServiceLifecycle,
    dependencies: ServiceDependencies
  ): Result<void, ContainerError> {
    if (this.scopeManager.isDisposed()) {
      return err({
        code: "Disposed",
        message: `Cannot register service on disposed container`,
        tokenDescription: String(token),
      });
    }

    if (this.validationState === "validated") {
      return err({
        code: "InvalidOperation",
        message: "Cannot register after validation",
      });
    }

    // Validate factory parameter
    if (!factory || typeof factory !== "function") {
      return err({
        code: "InvalidFactory",
        message: "Factory must be a function",
        tokenDescription: String(token),
      });
    }

    return this.registry.registerFactory(token, factory, lifecycle, dependencies);
  }

  /**
   * Register a constant value.
   */
  registerValue<TServiceType extends ServiceType>(
    token: InjectionToken<TServiceType>,
    value: TServiceType
  ): Result<void, ContainerError> {
    if (this.scopeManager.isDisposed()) {
      return err({
        code: "Disposed",
        message: `Cannot register service on disposed container`,
        tokenDescription: String(token),
      });
    }

    if (this.validationState === "validated") {
      return err({
        code: "InvalidOperation",
        message: "Cannot register after validation",
      });
    }

    return this.registry.registerValue(token, value);
  }

  /**
   * Register an alias.
   */
  registerAlias<TServiceType extends ServiceType>(
    aliasToken: InjectionToken<TServiceType>,
    targetToken: InjectionToken<TServiceType>
  ): Result<void, ContainerError> {
    if (this.scopeManager.isDisposed()) {
      return err({
        code: "Disposed",
        message: `Cannot register service on disposed container`,
        tokenDescription: String(aliasToken),
      });
    }

    if (this.validationState === "validated") {
      return err({
        code: "InvalidOperation",
        message: "Cannot register after validation",
      });
    }

    return this.registry.registerAlias(aliasToken, targetToken);
  }

  /**
   * Validate all registrations.
   */
  validate(): Result<void, ContainerError[]> {
    if (this.validationState === "validated") {
      return ok(undefined);
    }

    if (this.validationState === "validating") {
      return err([
        {
          code: "InvalidOperation",
          message: "Validation already in progress",
        },
      ]);
    }

    this.validationState = "validating";

    const result = this.validator.validate(this.registry);

    if (result.ok) {
      this.validationState = "validated";
    } else {
      this.validationState = "registering";
    }

    return result;
  }

  /**
   * Get validation state.
   */
  getValidationState(): ContainerValidationState {
    return this.validationState;
  }

  /**
   * Async-safe validation for concurrent environments.
   *
   * Prevents race conditions when multiple callers validate simultaneously
   * by ensuring only one validation runs at a time.
   *
   * @returns Promise resolving to validation result
   *
   * @example
   * ```typescript
   * const container = ServiceContainer.createRoot();
   * // ... register services
   * await container.validateAsync(); // Safe for concurrent calls
   * ```
   */
  async validateAsync(): Promise<Result<void, ContainerError[]>> {
    // Return immediately if already validated
    if (this.validationState === "validated") {
      return ok(undefined);
    }

    // Wait for ongoing validation
    if (this.validationPromise !== null) {
      return this.validationPromise;
    }

    // Validation already in progress (sync)
    if (this.validationState === "validating") {
      return err([
        {
          code: "InvalidOperation",
          message: "Validation already in progress",
        },
      ]);
    }

    this.validationState = "validating";

    this.validationPromise = Promise.resolve().then(() => {
      const result = this.validator.validate(this.registry);

      if (result.ok) {
        this.validationState = "validated";
      } else {
        this.validationState = "registering";
      }

      return result;
    });

    const result = await this.validationPromise;
    this.validationPromise = null;

    return result;
  }

  /**
   * Creates a child scope container.
   *
   * Child containers:
   * - Inherit parent registrations (cloned)
   * - Can add their own registrations
   * - Must call validate() before resolving
   * - Share parent's singleton instances
   * - Have isolated scoped instances
   *
   * @param name - Optional custom name for the scope
   * @returns Result with child container or error
   *
   * @example
   * ```typescript
   * const parent = ServiceContainer.createRoot();
   * parent.registerClass(LoggerToken, Logger, SINGLETON);
   * parent.validate();
   *
   * const child = parent.createScope("request").value!;
   * child.registerClass(RequestToken, RequestContext, SCOPED);
   * child.validate();
   *
   * const logger = child.resolve(LoggerToken);   // From parent (shared)
   * const ctx = child.resolve(RequestToken);      // From child (isolated)
   * ```
   */
  createScope(name?: string): Result<ServiceContainer, ContainerError> {
    if (this.scopeManager.isDisposed()) {
      return err({
        code: "Disposed",
        message: `Cannot create scope from disposed container`,
      });
    }

    if (this.validationState !== "validated") {
      return err({
        code: "NotValidated",
        message: "Parent must be validated before creating scopes. Call validate() first.",
      });
    }

    // Create child scope (pure Result, no throws)
    const scopeResult = this.scopeManager.createChild(name);
    if (!scopeResult.ok) {
      return err(scopeResult.error); // Structured error, not exception
    }

    // Build child container components
    const childRegistry = this.registry.clone();
    const childCache = scopeResult.value.cache;
    const childManager = scopeResult.value.manager;
    const childResolver = new ServiceResolver(
      childRegistry,
      childCache,
      this.resolver, // Parent resolver for singleton delegation
      scopeResult.value.scopeName
    );

    // Create child using private constructor
    const child = new ServiceContainer(
      childRegistry,
      this.validator, // Shared (stateless)
      childCache,
      childResolver,
      childManager,
      "registering" // FIX: Child starts in registering state, not validated!
    );

    return ok(child);
  }

  /**
   * Resolve service with Result return.
   */
  resolveWithError<TServiceType extends ServiceType>(
    token: InjectionToken<TServiceType>
  ): Result<TServiceType, ContainerError> {
    if (this.scopeManager.isDisposed()) {
      return err({
        code: "Disposed",
        message: `Cannot resolve from disposed container`,
        tokenDescription: String(token),
      });
    }

    if (this.validationState !== "validated") {
      return err({
        code: "NotValidated",
        message: "Container must be validated before resolving. Call validate() first.",
        tokenDescription: String(token),
      });
    }

    return this.resolver.resolve(token);
  }

  /**
   * Resolve service (throwing version with fallback support).
   */
  resolve<TServiceType extends ServiceType>(token: InjectionToken<TServiceType>): TServiceType {
    const result = this.resolveWithError(token);

    if (isOk(result)) {
      return result.value;
    }

    // Try fallback factory
    const fallback = this.fallbackFactories.get(token);
    if (fallback) {
      return fallback() as TServiceType;
    }

    // No fallback - throw
    throw new Error(
      `Cannot resolve ${String(token)}: ${result.error.message}. ` +
        `No fallback factory registered for this token.`
    );
  }

  /**
   * Check if service is registered.
   */
  isRegistered<TServiceType extends ServiceType>(
    token: InjectionToken<TServiceType>
  ): Result<boolean, never> {
    return ok(this.registry.has(token));
  }

  /**
   * Register a fallback factory for a specific token.
   * This will be used when resolve() fails for that token.
   *
   * @param token - The injection token
   * @param factory - Factory function that creates a fallback instance
   *
   * @example
   * ```typescript
   * container.registerFallback(UserServiceToken, () => new DefaultUserService());
   * ```
   */
  registerFallback<TServiceType extends ServiceType>(
    token: InjectionToken<TServiceType>,
    factory: FallbackFactory<TServiceType>
  ): void {
    this.fallbackFactories.set(token, factory as FallbackFactory<ServiceType>);
  }

  /**
   * Dispose container and all children.
   */
  dispose(): Result<void, ContainerError> {
    const result = this.scopeManager.dispose();

    // Reset validation state after disposal (per review feedback)
    if (result.ok) {
      this.validationState = "registering";
    }

    return result;
  }

  /**
   * Clear all registrations and instances.
   *
   * IMPORTANT: Resets validation state (per review feedback).
   */
  clear(): Result<void, never> {
    this.registry.clear();
    this.cache.clear();
    this.validationState = "registering"; // Critical: reset validation state
    return ok(undefined);
  }
}
