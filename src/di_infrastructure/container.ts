import type { InjectionToken } from "./types/injectiontoken";
import type { FactoryFunction } from "./types/servicefactory";
import type { ServiceClass } from "./types/serviceclass";
import type { ServiceDependencies } from "./types/servicedependencies";
import type { ContainerValidationState } from "./types/containervalidationstate";
import { ServiceLifecycle } from "@/di_infrastructure/types/servicelifecycle";
import type { ServiceType } from "@/types/servicetypeindex";
import { ok, err, tryCatch, isErr, isOk } from "@/utils/result";
import type { Result } from "@/types/result";
import type { Container } from "@/di_infrastructure/interfaces/container";
import type { ContainerError } from "@/di_infrastructure/interfaces/containererror";
import type { ContainerErrorCode } from "@/di_infrastructure/types/containererrorcode";

/**
 * Fallback factory function type for creating service instances when container resolution fails.
 */
type FallbackFactory<T extends ServiceType> = () => T;

/**
 * Global registry of fallback factories for known tokens.
 * Used when container resolution fails and a fallback is available.
 */
const fallbackFactories = new Map<symbol, FallbackFactory<ServiceType>>();

/**
 * Register a fallback factory for a specific token.
 * This will be used when container.resolve() fails for that token.
 *
 * @param token - The injection token
 * @param factory - Factory function that creates a fallback instance
 *
 * @example
 * ```typescript
 * registerFallback(UserServiceToken, () => new DefaultUserService());
 * ```
 */
export function registerFallback<T extends ServiceType>(
  token: InjectionToken<T>,
  factory: FallbackFactory<T>
): void {
  fallbackFactories.set(token, factory as FallbackFactory<ServiceType>);
}

/**
 * Dependency injection container that manages service lifecycles.
 * Supports Singleton, Transient, and Scoped service patterns with hierarchical container support.
 *
 * **Scope Chain Behavior:**
 * When a parent container is disposed, all child containers are automatically disposed.
 * This ensures proper cleanup of resources across the container hierarchy.
 *
 * @example
 * ```typescript
 * // Basic usage
 * const container = new ServiceContainer();
 * container.register(LoggerToken, () => new Logger(), ServiceLifecycle.SINGLETON);
 * const logger = container.resolve(LoggerToken);
 * ```
 *
 * @example
 * ```typescript
 * // Scope chain with cascading disposal
 * const root = new ServiceContainer();
 * const child1 = root.createScope("child1");
 * const child2 = root.createScope("child2");
 * const grandchild = child1.createScope("grandchild");
 *
 * // Disposing root automatically disposes all children
 * root.dispose();
 * // All child containers (child1, child2, grandchild) are now disposed
 * ```
 */
export class ServiceContainer implements Container {
  /** Service registrations mapping tokens to factories and lifecycles */
  #serviceRegistrations: Map<
    symbol,
    {
      factory: () => any;
      lifecycle: ServiceLifecycle;
      dependencies: ServiceDependencies;
      providerType: "class" | "factory" | "value" | "alias";
      aliasTarget?: symbol;
    }
  > = new Map();

  /** Current validation state of the container */
  #validationState: ContainerValidationState = "registering";

  /** Cached service instances for Singleton and Scoped lifecycles */
  #serviceInstances: Map<symbol, any> = new Map();

  /** Reference to parent container in the scope hierarchy */
  readonly #parentContainer: ServiceContainer | null = null;

  /** Flag indicating if this container has been disposed */
  #disposed: boolean = false;

  /** Hierarchical name for debugging and error messages (e.g., "root.child1") */
  readonly #scopeName: string | null = null;

  /** Set of all child containers for cascading disposal */
  #children: Set<ServiceContainer> = new Set();

  /**
   * Creates a new service container.
   * If a parent container is provided, creates a scoped child container.
   *
   * **Important:** Child containers are automatically registered with the parent
   * and will be disposed when the parent is disposed (cascading disposal).
   *
   * @param parentContainer - Optional parent container for hierarchical DI
   * @param scopeName - Optional name for the scope (auto-generated if not provided)
   *
   * @example
   * ```typescript
   * // Root container
   * const root = new ServiceContainer();
   *
   * // Scoped container (child) with auto-generated name
   * const scope = new ServiceContainer(root);
   *
   * // Scoped container (child) with custom name
   * const namedScope = new ServiceContainer(root, "myScope");
   *
   * // All children are tracked by root for cascading disposal
   * root.dispose(); // Automatically disposes scope and namedScope
   * ```
   */
  constructor(parentContainer: ServiceContainer | null = null, scopeName: string | null = null) {
    if (parentContainer !== null) {
      // Child inherits all service registrations from parent
      // This allows child containers to resolve services registered in parent
      this.#serviceRegistrations = new Map(parentContainer.#serviceRegistrations);

      // Child starts with empty instances - each child has its own scope
      // Singleton instances are still shared via parent lookup in resolve()
      this.#serviceInstances = new Map();

      this.#parentContainer = parentContainer;

      // Build hierarchical scope name for debugging
      // Format: "root.child1.child2" etc.
      this.#scopeName =
        parentContainer.#scopeName +
        "." +
        (scopeName ?? "scope" + crypto.randomUUID() + Date.now());
      this.#disposed = false;

      // Register this child with parent for cascading disposal
      // When parent is disposed, this child will be automatically disposed too
      parentContainer.#children.add(this);
    } else {
      this.#scopeName = "root";
      this.#disposed = false;
    }
  }

  /**
   * Create a child container with its own scope.
   * Inherits service registrations from parent but maintains separate scoped instances.
   *
   * @param name - Optional name for the scope (auto-generated if not provided)
   * @returns Result containing a new scoped container or an error if this container is disposed
   *
   * @example
   * ```typescript
   * const rootContainer = new ServiceContainer();
   * const scopedContainer = rootContainer.createScope();
   * if (isErr(scopedContainer)) {
   *   console.error(scopedContainer.error.message);
   * }
   * ```
   */
  createScope(name?: string): Result<ServiceContainer, ContainerError> {
    if (this.#disposed) {
      return err({
        code: "Disposed",
        message: `Cannot create scope from disposed container: ${this.#scopeName}`,
      });
    }

    if (this.#validationState !== "validated") {
      return err({
        code: "NotValidated",
        message: "Parent must be validated before creating scopes. Call validate() first.",
      });
    }

    const child = new ServiceContainer(this, name ?? null);
    child.#validationState = "validated";

    return ok(child);
  }

  /**
   * Check if a service is registered.
   * Recursively checks the entire parent container hierarchy from root to this container.
   *
   * @template TServiceType - The type of service
   * @param token - The injection token to check
   * @returns Result indicating if registered in this container or any parent container
   *
   * @example
   * ```typescript
   * const root = new ServiceContainer();
   * const scope1 = root.createScope();
   * const scope2 = scope1.createScope();
   *
   * root.register(LoggerToken, () => new Logger(), SINGLETON);
   * const result = scope2.isRegistered(LoggerToken);
   * if (isOk(result) && result.value) {
   *   // Service is registered
   * }
   * ```
   */
  isRegistered<TServiceType extends ServiceType>(
    token: InjectionToken<TServiceType>
  ): Result<boolean, never> {
    if (this.#parentContainer !== null) {
      return this.#parentContainer.isRegistered(token);
    }
    return ok(this.#serviceRegistrations.has(token));
  }

  /**
   * Dispose this container and clean up all scoped instances.
   * Services implementing Disposable will have their dispose() method called automatically.
   *
   * **Cascading Disposal:** All child containers are automatically disposed recursively.
   * Child disposal errors are logged but do not stop parent disposal.
   *
   * Root container clearing requires manual clear() call.
   *
   * @returns Result indicating success or any disposal errors
   *
   * @example
   * ```typescript
   * const root = new ServiceContainer();
   * const child = root.createScope();
   * const db = child.resolve(DatabaseToken); // Implements Disposable
   *
   * // Disposing root automatically disposes child (and db.dispose() is called)
   * const result = root.dispose();
   * if (isErr(result)) {
   *   console.error("Disposal failed:", result.error);
   * }
   * ```
   */
  dispose(): Result<void, ContainerError> {
    // Check if already disposed
    if (this.#disposed) {
      return err({
        code: "Disposed",
        message: `Container already disposed: ${this.#scopeName}`,
      });
    }

    // Mark as disposed immediately BEFORE disposing children
    // This prevents new operations on this container while disposal is in progress
    this.#disposed = true;

    // Recursively dispose all child containers (cascading disposal)
    // Note: Child disposal errors are caught and logged but don't stop the disposal process
    for (const child of this.#children) {
      const childResult = tryCatch(
        () => child.dispose(),
        (error): ContainerError => ({
          code: "DisposalFailed",
          message: `Error disposing child container ${child.#scopeName}: ${String(error)}`,
          cause: error,
        })
      );
      if (isErr(childResult)) {
        // Log error but continue with disposal
        console.warn(`Failed to dispose child container ${child.#scopeName}:`, childResult.error);
      }
    }

    // Dispose all scoped instances that implement Disposable
    for (const [token, instance] of this.#serviceInstances.entries()) {
      if (this.isDisposable(instance)) {
        const result = tryCatch(
          () => instance.dispose(),
          (error): ContainerError => ({
            code: "DisposalFailed",
            message: `Error disposing service ${String(token)}: ${String(error)}`,
            tokenDescription: String(token),
            cause: error,
          })
        );

        if (isErr(result)) {
          return result;
        }
      }
    }

    // Clear all instances
    this.#serviceInstances.clear();

    // Clean up: Remove this container from parent's children set
    // This breaks the reference to prevent memory leaks
    if (this.#parentContainer !== null) {
      this.#parentContainer.#children.delete(this);
    }

    // Reset validation state
    this.#validationState = "registering";

    return ok(undefined);
  }

  /**
   * Check if an instance implements the Disposable interface.
   *
   * @param instance - The service instance to check
   * @returns True if the instance has a dispose() method
   */
  private isDisposable(instance: ServiceType): instance is ServiceType & { dispose: () => void } {
    return (
      "dispose" in instance &&
      typeof (instance as ServiceType & { dispose: unknown }).dispose === "function"
    );
  }

  /**
   * Clear all service registrations and instances.
   * Use with caution - this will remove all configured services.
   * Note: dispose() should be used for scoped containers instead.
   *
   * @returns Result indicating success
   */
  clear(): Result<void, never> {
    this.#serviceRegistrations.clear();
    this.#serviceInstances.clear();
    return ok(undefined);
  }

  /**
   * Register a service class with automatic dependency injection.
   *
   * @template TServiceType - The type of service to register
   * @param token - The injection token that identifies this service
   * @param serviceClass - The service class to instantiate
   * @param lifecycle - Service lifecycle strategy
   * @returns Result indicating success or registration error
   */
  registerClass<TServiceType extends ServiceType>(
    token: InjectionToken<TServiceType>,
    serviceClass: ServiceClass<TServiceType>,
    lifecycle: ServiceLifecycle
  ): Result<void, ContainerError> {
    if (this.#disposed) {
      return err({
        code: "Disposed",
        message: `Cannot register service on disposed container: ${String(token)}`,
        tokenDescription: String(token),
      });
    }

    if (this.#validationState === "validated") {
      return err({
        code: "InvalidOperation",
        message: "Cannot register after validation",
      });
    }

    if (this.#serviceRegistrations.has(token)) {
      return err({
        code: "DuplicateRegistration",
        message: `Service ${String(token)} already registered`,
        tokenDescription: String(token),
      });
    }

    const dependencies = (serviceClass as any).dependencies ?? [];

    const factory = () => {
      const resolvedDeps = dependencies.map((dep: InjectionToken<ServiceType>) => {
        const result = this.resolveWithError(dep);
        if (isErr(result)) {
          throw new Error(`Dependency ${String(dep)} could not be resolved`);
        }
        return result.value;
      });
      return new serviceClass(...resolvedDeps);
    };

    this.#serviceRegistrations.set(token, {
      factory,
      lifecycle,
      dependencies,
      providerType: "class",
    });

    return ok(undefined);
  }

  /**
   * Register a factory function that creates service instances.
   *
   * @template T - The type this factory creates
   * @param token - The injection token that identifies this service
   * @param factory - Factory function that creates the service instance
   * @param lifecycle - Service lifecycle strategy
   * @param dependencies - Array of tokens this factory depends on
   * @returns Result indicating success or registration error
   */
  registerFactory<T>(
    token: symbol,
    factory: FactoryFunction<T>,
    lifecycle: ServiceLifecycle,
    dependencies: ServiceDependencies
  ): Result<void, ContainerError> {
    if (this.#disposed) {
      return err({
        code: "Disposed",
        message: `Cannot register service on disposed container: ${String(token)}`,
        tokenDescription: String(token),
      });
    }

    if (this.#validationState === "validated") {
      return err({
        code: "InvalidOperation",
        message: "Cannot register after validation",
      });
    }

    if (this.#serviceRegistrations.has(token)) {
      return err({
        code: "DuplicateRegistration",
        message: `Service ${String(token)} already registered`,
        tokenDescription: String(token),
      });
    }

    this.#serviceRegistrations.set(token, {
      factory,
      lifecycle,
      dependencies,
      providerType: "factory",
    });

    return ok(undefined);
  }

  /**
   * Register a constant value (always singleton).
   *
   * @template T - The type of value
   * @param token - The injection token that identifies this value
   * @param value - The value to register
   * @returns Result indicating success or registration error
   */
  registerValue<T>(token: symbol, value: T): Result<void, ContainerError> {
    if (this.#disposed) {
      return err({
        code: "Disposed",
        message: `Cannot register service on disposed container: ${String(token)}`,
        tokenDescription: String(token),
      });
    }

    if (this.#validationState === "validated") {
      return err({
        code: "InvalidOperation",
        message: "Cannot register after validation",
      });
    }

    if (this.#serviceRegistrations.has(token)) {
      return err({
        code: "DuplicateRegistration",
        message: `Service ${String(token)} already registered`,
        tokenDescription: String(token),
      });
    }

    // Runtime check: values must not be functions or classes
    if (typeof value === "function") {
      return err({
        code: "InvalidOperation",
        message:
          "registerValue() only accepts plain values, not classes or functions. Use registerClass() or registerFactory() instead.",
        tokenDescription: String(token),
      });
    }

    this.#serviceRegistrations.set(token, {
      factory: () => value,
      lifecycle: ServiceLifecycle.SINGLETON,
      dependencies: [],
      providerType: "value",
    });

    return ok(undefined);
  }

  /**
   * Register an alias that points to another token.
   *
   * @template TServiceType - The type of service
   * @param aliasToken - The alias token
   * @param targetToken - The token to resolve instead
   * @returns Result indicating success or registration error
   */
  registerAlias<TServiceType extends ServiceType>(
    aliasToken: InjectionToken<TServiceType>,
    targetToken: InjectionToken<TServiceType>
  ): Result<void, ContainerError> {
    if (this.#disposed) {
      return err({
        code: "Disposed",
        message: `Cannot register service on disposed container: ${String(aliasToken)}`,
        tokenDescription: String(aliasToken),
      });
    }

    if (this.#validationState === "validated") {
      return err({
        code: "InvalidOperation",
        message: "Cannot register after validation",
      });
    }

    if (this.#serviceRegistrations.has(aliasToken)) {
      return err({
        code: "DuplicateRegistration",
        message: `Service ${String(aliasToken)} already registered`,
        tokenDescription: String(aliasToken),
      });
    }

    const factory = () => {
      const result = this.resolveWithError(targetToken);
      if (isErr(result)) {
        throw new Error(`Alias target ${String(targetToken)} not found`);
      }
      return result.value;
    };

    this.#serviceRegistrations.set(aliasToken, {
      factory,
      lifecycle: ServiceLifecycle.SINGLETON,
      dependencies: [targetToken],
      providerType: "alias",
      aliasTarget: targetToken,
    });

    return ok(undefined);
  }

  /**
   * Validate all registered services and their dependencies.
   */
  validate(): Result<void, ContainerError[]> {
    if (this.#validationState === "validated") {
      return ok(undefined);
    }

    if (this.#validationState === "validating") {
      return err([
        {
          code: "InvalidOperation",
          message: "Validation already in progress",
        },
      ]);
    }

    this.#validationState = "validating";

    const errors = this.validateAllDependencies();

    if (errors.length > 0) {
      this.#validationState = "registering";
      return err(errors);
    }

    this.#validationState = "validated";
    return ok(undefined);
  }

  /**
   * Get the current validation state of the container.
   */
  getValidationState(): ContainerValidationState {
    return this.#validationState;
  }

  /**
   * Resolve a service instance from the container with explicit error handling.
   *
   * @template TServiceType - The type of service to resolve
   * @param token - The injection token identifying the service
   * @returns Result containing the service instance or an error
   *
   * @example
   * ```typescript
   * const result = container.resolveWithError(LoggerToken);
   * if (isOk(result)) {
   *   const logger = result.value;
   *   logger.info("Service resolved successfully");
   * }
   * ```
   */
  resolveWithError<TServiceType extends ServiceType>(
    token: InjectionToken<TServiceType>
  ): Result<TServiceType, ContainerError> {
    if (this.#disposed) {
      return err({
        code: "Disposed",
        message: `Cannot resolve service from disposed container: ${String(token)}`,
        tokenDescription: String(token),
      });
    }

    if (this.#validationState !== "validated") {
      return err({
        code: "NotValidated",
        message: "Container must be validated before resolving. Call validate() first.",
        tokenDescription: String(token),
      });
    }

    // Check if service is registered
    const checkResult = this.isRegistered(token);
    if (isErr(checkResult) || !checkResult.value) {
      return err({
        code: "TokenNotRegistered",
        message: `Service ${String(token)} not registered`,
        tokenDescription: String(token),
      });
    }

    const service = this.#serviceRegistrations.get(token);
    if (!service) {
      return err({
        code: "TokenNotRegistered",
        message: `Service ${String(token)} not registered`,
        tokenDescription: String(token),
      });
    }

    return tryCatch(
      () => {
        switch (service.lifecycle) {
          case ServiceLifecycle.SINGLETON:
            // Singleton: Check Parent first (for Child-Container)
            if (this.#parentContainer !== null) {
              const parentResult = this.#parentContainer.resolveWithError(token);
              if (isErr(parentResult)) {
                throw new Error("CIRCULAR_DEPENDENCY");
              }
              return parentResult.value;
            }
            // Singleton: Check current container
            if (!this.#serviceInstances.has(token)) {
              this.#serviceInstances.set(token, service.factory() as TServiceType);
            }
            return this.#serviceInstances.get(token) as TServiceType;

          case ServiceLifecycle.TRANSIENT:
            // Transient: Always create new instance (no caching)
            return service.factory() as TServiceType;

          case ServiceLifecycle.SCOPED:
            // Scoped: One instance per child container scope
            // MUST be in child container (not root) to have a parent scope reference
            if (this.#parentContainer === null) {
              throw new Error("SCOPED_REQUIRES_CONTAINER");
            }
            // Create instance on first access, reuse for subsequent resolves in same scope
            if (!this.#serviceInstances.has(token)) {
              this.#serviceInstances.set(token, service.factory() as TServiceType);
            }
            return this.#serviceInstances.get(token) as TServiceType;

          default:
            throw new Error("INVALID_LIFECYCLE");
        }
      },
      (error): ContainerError => {
        const errorMessage = String(error);
        let code: ContainerErrorCode;
        let message: string;

        // Classify error based on predefined error message patterns
        // These patterns are thrown in the switch statement above to enable proper categorization
        if (errorMessage.includes("CIRCULAR_DEPENDENCY")) {
          code = "CircularDependency";
          message = `Circular dependency detected for service ${String(token)}`;
        } else if (errorMessage.includes("SCOPED_REQUIRES_CONTAINER")) {
          code = "ScopeRequired";
          message = `Scoped service ${String(token)} requires a scope container`;
        } else if (errorMessage.includes("INVALID_LIFECYCLE")) {
          code = "InvalidLifecycle";
          message = `Invalid service lifecycle: ${String(service.lifecycle)}`;
        } else {
          code = "FactoryFailed";
          message = `Error creating service ${String(token)}: ${errorMessage}`;
        }

        return {
          code,
          message,
          tokenDescription: String(token),
          cause: error,
        };
      }
    );
  }

  /**
   * Resolve a service instance directly from the container.
   * Uses fallback factory if container resolution fails and a fallback is registered.
   *
   * @template TServiceType - The type of service to resolve
   * @param token - The injection token identifying the service
   * @returns The resolved service instance
   * @throws Error if container resolution fails and no fallback is registered
   *
   * @example
   * ```typescript
   * // Direct resolution with automatic fallback
   * const logger = container.resolve(loggerToken);
   * logger.info("This will work even if container resolution fails!");
   * ```
   */
  resolve<TServiceType extends ServiceType>(token: InjectionToken<TServiceType>): TServiceType {
    const result = this.resolveWithError(token);

    if (isOk(result)) {
      return result.value;
    }

    // Try fallback factory if available
    const fallback = fallbackFactories.get(token);
    if (fallback) {
      return fallback() as TServiceType;
    }

    // No fallback available - throw error with helpful message
    throw new Error(
      `Cannot resolve ${String(token)}: ${result.error.message}. ` +
        `No fallback factory registered for this token.`
    );
  }

  /**
   * Validate all dependencies and check for circular dependencies.
   */
  private validateAllDependencies(): ContainerError[] {
    const errors: ContainerError[] = [];

    // 1. Check that all dependencies are registered
    for (const [token, registration] of this.#serviceRegistrations.entries()) {
      for (const dep of registration.dependencies) {
        if (!this.#serviceRegistrations.has(dep)) {
          errors.push({
            code: "TokenNotRegistered",
            message: `${String(token)} depends on ${String(dep)} which is not registered`,
            tokenDescription: String(dep),
          });
        }
      }
    }

    // 2. Check alias targets
    for (const [token, registration] of this.#serviceRegistrations.entries()) {
      if (registration.providerType === "alias" && registration.aliasTarget) {
        if (!this.#serviceRegistrations.has(registration.aliasTarget)) {
          errors.push({
            code: "AliasTargetNotFound",
            message: `Alias ${String(token)} points to ${String(registration.aliasTarget)} which is not registered`,
            tokenDescription: String(registration.aliasTarget),
          });
        }
      }
    }

    // 3. Check for circular dependencies
    const circularErrors = this.detectCircularDependencies();
    errors.push(...circularErrors);

    return errors;
  }

  /**
   * Detect circular dependencies using DFS.
   */
  private detectCircularDependencies(): ContainerError[] {
    const errors: ContainerError[] = [];
    const visited = new Set<symbol>();

    for (const token of this.#serviceRegistrations.keys()) {
      const visiting = new Set<symbol>();
      const path: symbol[] = [];

      const error = this.checkCycleForToken(token, visiting, visited, path);
      if (error) {
        errors.push(error);
      }
    }

    return errors;
  }

  /**
   * Check for cycles starting from a specific token.
   */
  private checkCycleForToken(
    token: symbol,
    visiting: Set<symbol>,
    visited: Set<symbol>,
    path: symbol[]
  ): ContainerError | null {
    if (visiting.has(token)) {
      const cyclePath = [...path, token].map(String).join(" → ");
      return {
        code: "CircularDependency",
        message: `Circular dependency: ${cyclePath}`,
        tokenDescription: String(token),
      };
    }

    if (visited.has(token)) {
      return null;
    }

    visiting.add(token);
    path.push(token);

    const registration = this.#serviceRegistrations.get(token);
    if (registration) {
      for (const dep of registration.dependencies) {
        const error = this.checkCycleForToken(dep, visiting, visited, path);
        if (error) return error;
      }
    }

    visiting.delete(token);
    path.pop();
    visited.add(token);

    return null;
  }
}
