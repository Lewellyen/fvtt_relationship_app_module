import type { InjectionToken } from "./types/injectiontoken";
import type { FactoryFunction } from "./types/servicefactory";
import type { ServiceClass } from "./types/serviceclass";
import type { ServiceDependencies } from "./types/servicedependencies";
import type { ContainerValidationState } from "./types/containervalidationstate";
import type { ApiSafeToken } from "./types/api-safe-token";
import { isApiSafeTokenRuntime } from "./types/api-safe-token";
import { ServiceLifecycle } from "@/di_infrastructure/types/servicelifecycle";
import type { ServiceType } from "@/types/servicetypeindex";
import { ok, err, isOk } from "@/utils/functional/result";
import type { Result } from "@/types/result";
import type { Container } from "@/di_infrastructure/interfaces/container";
import type { ContainerError } from "@/di_infrastructure/interfaces/containererror";
import { ServiceRegistry } from "./registry/ServiceRegistry";
import { ContainerValidator } from "./validation/ContainerValidator";
import { InstanceCache } from "./cache/InstanceCache";
import { ServiceResolver } from "./resolution/ServiceResolver";
import { ScopeManager } from "./scope/ScopeManager";
import { withTimeout, TimeoutError } from "@/utils/async/promise-timeout";
import { ENV } from "@/config/environment";
import { BootstrapPerformanceTracker } from "@/observability/bootstrap-performance-tracker";
import { RuntimeConfigService } from "@/core/runtime-config/runtime-config.service";

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
   * **Bootstrap Performance Tracking:**
   * Uses BootstrapPerformanceTracker with RuntimeConfigService(ENV) und null MetricsCollector.
   * MetricsCollector is injected later via setMetricsCollector() after validation.
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

    // Bootstrap performance tracker (no MetricsCollector yet)
    const performanceTracker = new BootstrapPerformanceTracker(new RuntimeConfigService(ENV), null);
    const resolver = new ServiceResolver(registry, cache, null, "root", performanceTracker);

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
   * Returns a previously registered constant value without requiring validation.
   * Useful for bootstrap/static values that are needed while the container is still registering services.
   */
  getRegisteredValue<TServiceType extends ServiceType>(
    token: InjectionToken<TServiceType>
  ): TServiceType | null {
    const registration = this.registry.getRegistration(token);
    if (!registration) {
      return null;
    }
    if (registration.providerType !== "value") {
      return null;
    }
    const value = registration.value as TServiceType | undefined;
    if (value === undefined) {
      return null;
    }
    return value;
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

    /* c8 ignore start -- Guard against concurrent validate() calls; requires re-entrant call during validation which is not possible in normal synchronous flow */
    if (this.validationState === "validating") {
      return err([
        {
          code: "InvalidOperation",
          message: "Validation already in progress",
        },
      ]);
    }
    /* c8 ignore stop */

    this.validationState = "validating";

    const result = this.validator.validate(this.registry);

    if (result.ok) {
      this.validationState = "validated";
      // Inject MetricsCollector into resolver after validation (if available)
      void this.injectMetricsCollector();
    } else {
      this.validationState = "registering";
    }

    return result;
  }

  /**
   * Injects MetricsCollector into resolver and cache after validation.
   * This enables metrics recording without circular dependencies during bootstrap.
   *
   * Note: EnvironmentConfig is already injected via BootstrapPerformanceTracker
   * during container creation, so only MetricsCollector needs to be injected here.
   */
  private async injectMetricsCollector(): Promise<void> {
    // Dynamic import to avoid circular dependency during module loading
    const { metricsCollectorToken } = await import("../tokens/tokenindex.js");
    const metricsResult = this.resolveWithError(metricsCollectorToken);
    if (metricsResult.ok) {
      this.resolver.setMetricsCollector(metricsResult.value);
      this.cache.setMetricsCollector(metricsResult.value);
    }
  }

  /**
   * Get validation state.
   */
  getValidationState(): ContainerValidationState {
    return this.validationState;
  }

  /**
   * Async-safe validation for concurrent environments with timeout.
   *
   * Prevents race conditions when multiple callers validate simultaneously
   * by ensuring only one validation runs at a time.
   *
   * @param timeoutMs - Timeout in milliseconds (default: 30000 = 30 seconds)
   * @returns Promise resolving to validation result
   *
   * @example
   * ```typescript
   * const container = ServiceContainer.createRoot();
   * // ... register services
   * await container.validateAsync(); // Safe for concurrent calls
   * await container.validateAsync(5000); // With 5 second timeout
   * ```
   */
  async validateAsync(timeoutMs: number = 30000): Promise<Result<void, ContainerError[]>> {
    // Return immediately if already validated
    /* c8 ignore start -- Fast-path optimization; tested in sync validate() */
    if (this.validationState === "validated") {
      return ok(undefined);
    }
    /* c8 ignore stop */

    // Wait for ongoing validation
    /* c8 ignore start -- Race condition guard for concurrent validateAsync calls; requires complex async timing to test */
    if (this.validationPromise !== null) {
      return this.validationPromise;
    }
    /* c8 ignore stop */

    // Validation already in progress (sync)
    /* c8 ignore start -- Mixed sync/async validation conflict; requires calling validate() then validateAsync() which is not a real use case */
    if (this.validationState === "validating") {
      return err([
        {
          code: "InvalidOperation",
          message: "Validation already in progress",
        },
      ]);
    }
    /* c8 ignore stop */

    this.validationState = "validating";

    // Track if timeout occurred to prevent state changes after timeout
    let timedOut = false;

    // Create validation task
    const validationTask = Promise.resolve().then(() => {
      const result = this.validator.validate(this.registry);

      // Only update state if no timeout occurred
      if (!timedOut) {
        if (result.ok) {
          this.validationState = "validated";
        } else {
          this.validationState = "registering";
        }
      }

      return result;
    });

    // Wrap validation with timeout
    try {
      this.validationPromise = withTimeout(validationTask, timeoutMs);
      const result = await this.validationPromise;

      // Inject MetricsCollector if validation succeeded
      if (result.ok) {
        await this.injectMetricsCollector();
      }

      return result;
      /* c8 ignore start -- Timeout handling requires precise race condition setup; difficult to test reliably */
    } catch (error) {
      // Handle timeout
      if (error instanceof TimeoutError) {
        timedOut = true; // Mark timeout occurred
        this.validationState = "registering"; // Deterministisch zurücksetzen
        return err([
          {
            code: "InvalidOperation",
            message: `Validation timed out after ${timeoutMs}ms`,
          },
        ]);
      }
      // Re-throw unexpected errors
      throw error;
      /* c8 ignore stop */
    } finally {
      /* c8 ignore next -- State cleanup always executed; null assignment is cleanup logic not business logic */
      this.validationPromise = null;
    }
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

    // Create performance tracker for child (same as root)
    const childPerformanceTracker = new BootstrapPerformanceTracker(
      new RuntimeConfigService(ENV),
      null
    );
    const childResolver = new ServiceResolver(
      childRegistry,
      childCache,
      this.resolver, // Parent resolver for singleton delegation
      scopeResult.value.scopeName,
      childPerformanceTracker
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
   * Resolves a service instance (throws on failure).
   *
   * **🎯 FOR EXTERNAL API USE ONLY**
   *
   * This method is designed for the public ModuleApi to provide
   * exception-based error handling for external Foundry VTT modules.
   *
   * **Enforcement (Defense-in-Depth):**
   * - **Compile-Time:** Only accepts ApiSafeToken types
   * - **Runtime:** Validates token has API_SAFE_RUNTIME_MARKER (always active)
   *
   * Internal code MUST use `resolveWithError()` for Result-based error handling.
   *
   * @param token - An API-safe injection token (from api.tokens)
   * @returns The resolved service instance
   * @throws {Error} If token is not API-safe or resolution fails
   *
   * @example External Module Usage
   * ```typescript
   * const api = game.modules.get('fvtt_relationship_app_module').api;
   *
   * try {
   *   const notifications = api.resolve(api.tokens.notificationCenterToken);
   *   notifications.error("Success", { code: "API", message: "It works" });
   * } catch (error) {
   *   console.error("Failed:", error);
   * }
   * ```
   *
   * @example Internal Code (WRONG - Use resolveWithError)
   * ```typescript
   * // ❌ TypeScript Error + Runtime Error
   * const notifications = container.resolve(notificationCenterToken);
   *
   * // ✅ CORRECT
   * const result = container.resolveWithError(notificationCenterToken);
   * if (result.ok) {
   *   result.value.error("Success", { code: "API", message: "It works" });
   * }
   * ```
   */
  resolve<TServiceType extends ServiceType>(token: ApiSafeToken<TServiceType>): TServiceType;

  /**
   * @deprecated Internal code must use resolveWithError()
   * @internal This overload prevents direct calls with non-branded tokens
   */
  resolve<TServiceType extends ServiceType>(token: InjectionToken<TServiceType>): never;

  // Implementation (unified for both overloads)
  resolve<TServiceType extends ServiceType>(
    token: InjectionToken<TServiceType> | ApiSafeToken<TServiceType>
  ): TServiceType {
    // 🛡️ RUNTIME GUARD (always active for defense-in-depth)
    if (!isApiSafeTokenRuntime(token)) {
      throw new Error(
        `API Boundary Violation: resolve() called with non-API-safe token: ${String(token)}.\n` +
          `This token was not marked via markAsApiSafe().\n` +
          `\n` +
          `Internal code MUST use resolveWithError() instead:\n` +
          `  const result = container.resolveWithError(${String(token)});\n` +
          `  if (result.ok) { /* use result.value */ }\n` +
          `\n` +
          `Only the public ModuleApi should expose resolve() for external modules.`
      );
    }

    // Standard resolution via Result pattern
    const result = this.resolveWithError(token);

    if (isOk(result)) {
      return result.value;
    }

    // Try fallback factory
    const fallback = this.fallbackFactories.get(token);
    if (fallback) {
      // Fallbacks are registered with matching generic type for public resolve()
      // Type alignment is ensured by registerFallback at registration time
      // type-coverage:ignore-next-line -- Type cast required due to Map<symbol, Factory> storage
      return fallback() as TServiceType;
    }

    // No fallback - throw with context
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
   * Synchronously dispose container and all children.
   *
   * Use this for scenarios where async disposal is not possible (e.g., browser unload).
   * For normal cleanup, prefer disposeAsync() which handles async disposal properly.
   *
   * @returns Result indicating success or disposal error
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
   * Asynchronously dispose container and all children.
   *
   * This is the preferred disposal method as it properly handles services that
   * implement AsyncDisposable, allowing for proper cleanup of resources like
   * database connections, file handles, or network sockets.
   *
   * Falls back to synchronous disposal for services implementing only Disposable.
   *
   * @returns Promise with Result indicating success or disposal error
   *
   * @example
   * ```typescript
   * // Preferred: async disposal
   * const result = await container.disposeAsync();
   * if (result.ok) {
   *   console.log("Container disposed successfully");
   * }
   *
   * // Browser unload (sync required)
   * window.addEventListener('beforeunload', () => {
   *   container.dispose();  // Sync fallback
   * });
   * ```
   */
  async disposeAsync(): Promise<Result<void, ContainerError>> {
    const result = await this.scopeManager.disposeAsync();

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
