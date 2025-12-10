import type { InjectionToken } from "./types/core/injectiontoken";
import type { FactoryFunction } from "./types/resolution/servicefactory";
import type { ServiceClass } from "./types/resolution/serviceclass";
import type { ServiceDependencies } from "./types/resolution/servicedependencies";
import type { ContainerValidationState } from "./types/errors/containervalidationstate";
import type { ApiSafeToken } from "./types/utilities/api-safe-token";
import { isApiSafeTokenRuntime } from "./types/utilities/api-safe-token";
import { ServiceLifecycle } from "./types/core/servicelifecycle";
import { ok, err } from "@/domain/utils/result";
import type { Result } from "@/domain/types/result";
import type { Container } from "./interfaces";
import type { ContainerError } from "./interfaces";
import type { PlatformContainerPort } from "@/domain/ports/platform-container-port.interface";
import type {
  DomainInjectionToken,
  DomainContainerError,
  DomainContainerValidationState,
} from "@/domain/types/container-types";
import { castResolvedService, castContainerErrorCode } from "./types/utilities/runtime-safe-cast";
import type { MetricsCollector } from "@/infrastructure/observability/metrics-collector";
import { ServiceRegistry } from "./registry/ServiceRegistry";
import { ContainerValidator } from "./validation/ContainerValidator";
import { InstanceCache } from "./cache/InstanceCache";
import { ServiceResolver } from "./resolution/ServiceResolver";
import { ScopeManager } from "./scope/ScopeManager";
import { withTimeout, TimeoutError } from "@/infrastructure/shared/utils/promise-timeout";
import type { EnvironmentConfig } from "@/domain/types/environment-config";
import { BootstrapPerformanceTracker } from "@/infrastructure/observability/bootstrap-performance-tracker";
import { createRuntimeConfig } from "@/application/services/runtime-config-factory";
import { metricsCollectorToken } from "@/infrastructure/shared/tokens/observability/metrics-collector.token";
import { ServiceRegistrationManager } from "./registration/ServiceRegistrationManager";
import { ContainerValidationManager } from "./validation/ContainerValidationManager";
import { ServiceResolutionManager } from "./resolution/ServiceResolutionManager";
import { ScopeManagementFacade } from "./scope/ScopeManagementFacade";
import { MetricsInjectionManager } from "./metrics/MetricsInjectionManager";
import { ApiSecurityManager } from "./security/ApiSecurityManager";

/**
 * Dependency injection container (Facade pattern).
 *
 * Delegates to specialized manager components:
 * - ServiceRegistrationManager: manages service registrations
 * - ContainerValidationManager: manages validation and validation state
 * - ServiceResolutionManager: manages service resolution
 * - ScopeManagementFacade: manages scope creation
 * - MetricsInjectionManager: manages metrics collector injection
 * - ApiSecurityManager: manages API security validation
 *
 * **Scope Chain Behavior:**
 * When a parent container is disposed, all child containers are automatically disposed.
 * This ensures proper cleanup of resources across the container hierarchy.
 *
 * **Architecture:**
 * This is a Facade that coordinates specialized manager components, adhering to Single Responsibility Principle.
 * Each manager has a focused responsibility, making the system testable and maintainable.
 *
 * @example
 * ```typescript
 * // Basic usage
 * const container = ServiceContainer.createRoot(ENV);
 * container.registerClass(LoggerToken, Logger, ServiceLifecycle.SINGLETON);
 * container.validate();
 * const logger = container.resolve(LoggerToken);
 * ```
 *
 * @example
 * ```typescript
 * // Scope chain with cascading disposal
 * const root = ServiceContainer.createRoot(ENV);
 * root.validate();
 * const child1 = root.createScope("child1").value!;
 * const child2 = root.createScope("child2").value!;
 *
 * // Disposing root automatically disposes all children
 * root.dispose();
 * ```
 */
export class ServiceContainer implements Container, PlatformContainerPort {
  private registry: ServiceRegistry;
  private validator: ContainerValidator;
  private cache: InstanceCache;
  private resolver: ServiceResolver;
  private scopeManager: ScopeManager;
  private readonly env: EnvironmentConfig;

  // Manager components (SRP refactoring)
  private registrationManager: ServiceRegistrationManager;
  private validationManager: ContainerValidationManager;
  private resolutionManager: ServiceResolutionManager;
  private scopeFacade: ScopeManagementFacade;
  private metricsInjectionManager: MetricsInjectionManager;
  private apiSecurityManager: ApiSecurityManager;

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
   * @param env - Environment configuration
   */
  private constructor(
    registry: ServiceRegistry,
    validator: ContainerValidator,
    cache: InstanceCache,
    resolver: ServiceResolver,
    scopeManager: ScopeManager,
    validationState: ContainerValidationState,
    env: EnvironmentConfig
  ) {
    this.registry = registry;
    this.validator = validator;
    this.cache = cache;
    this.resolver = resolver;
    this.scopeManager = scopeManager;
    this.env = env;

    // Initialize manager components
    this.validationManager = new ContainerValidationManager(validator, registry, validationState);
    this.registrationManager = new ServiceRegistrationManager(
      registry,
      () => this.scopeManager.isDisposed(),
      () => this.validationManager.getValidationState()
    );
    this.resolutionManager = new ServiceResolutionManager(
      resolver,
      () => this.scopeManager.isDisposed(),
      () => this.validationManager.getValidationState()
    );
    this.metricsInjectionManager = new MetricsInjectionManager(resolver, cache, (token) => {
      const result = this.resolutionManager.resolveWithError(token);
      // Convert DomainContainerError to ContainerError if needed
      if (!result.ok) {
        // DomainContainerError.code is string, but ContainerError.code is ContainerErrorCode
        // Use castContainerErrorCode to safely convert
        const containerError: ContainerError = {
          code: castContainerErrorCode(result.error.code),
          message: result.error.message,
          cause: result.error.cause,
          tokenDescription: String(token),
        };
        return err(containerError);
      }
      const metricsCollector = castResolvedService<MetricsCollector>(result.value);
      return ok(metricsCollector);
    });
    this.apiSecurityManager = new ApiSecurityManager();
    this.scopeFacade = new ScopeManagementFacade(
      scopeManager,
      () => this.scopeManager.isDisposed(),
      () => this.validationManager.getValidationState()
    );
  }

  /**
   * Creates a new root container.
   *
   * This is the preferred way to create containers.
   * All components are created fresh for the root container.
   *
   * **Bootstrap Performance Tracking:**
   * Uses BootstrapPerformanceTracker with RuntimeConfigService(env) und null MetricsCollector.
   * MetricsCollector is injected later via setMetricsCollector() after validation.
   *
   * @param env - Environment configuration (required for bootstrap performance tracking)
   * @returns A new root ServiceContainer
   *
   * @example
   * ```typescript
   * const container = ServiceContainer.createRoot(ENV);
   * container.registerClass(LoggerToken, Logger, SINGLETON);
   * container.validate();
   * ```
   */
  static createRoot(env: EnvironmentConfig): ServiceContainer {
    const registry = new ServiceRegistry();
    const validator = new ContainerValidator();
    const cache = new InstanceCache();
    const scopeManager = new ScopeManager("root", null, cache);

    // Bootstrap performance tracker (no MetricsCollector yet)
    const performanceTracker = new BootstrapPerformanceTracker(createRuntimeConfig(env), null);
    const resolver = new ServiceResolver(registry, cache, null, "root", performanceTracker);

    return new ServiceContainer(
      registry,
      validator,
      cache,
      resolver,
      scopeManager,
      "registering",
      env
    );
  }

  /**
   * Register a service class with automatic dependency injection.
   */
  registerClass<T>(
    token: InjectionToken<T>,
    serviceClass: ServiceClass<T>,
    lifecycle: ServiceLifecycle
  ): Result<void, ContainerError> {
    return this.registrationManager.registerClass(token, serviceClass, lifecycle);
  }

  /**
   * Register a factory function.
   */
  registerFactory<T>(
    token: InjectionToken<T>,
    factory: FactoryFunction<T>,
    lifecycle: ServiceLifecycle,
    dependencies: ServiceDependencies
  ): Result<void, ContainerError> {
    return this.registrationManager.registerFactory(token, factory, lifecycle, dependencies);
  }

  /**
   * Register a constant value.
   */
  registerValue<T>(token: InjectionToken<T>, value: T): Result<void, ContainerError> {
    return this.registrationManager.registerValue(token, value);
  }

  /**
   * Register an already created instance.
   * Internally treated the same as a value registration.
   */
  registerInstance<T>(token: InjectionToken<T>, instance: T): Result<void, ContainerError> {
    return this.registerValue(token, instance);
  }

  /**
   * Returns a previously registered constant value without requiring validation.
   * Useful for bootstrap/static values that are needed while the container is still registering services.
   */
  getRegisteredValue<T>(token: InjectionToken<T>): T | null {
    return this.registrationManager.getRegisteredValue(token);
  }

  /**
   * Register an alias.
   */
  registerAlias<T>(
    aliasToken: InjectionToken<T>,
    targetToken: InjectionToken<T>
  ): Result<void, ContainerError> {
    return this.registrationManager.registerAlias(aliasToken, targetToken);
  }

  /**
   * Validate all registrations.
   */
  validate(): Result<void, ContainerError[]> {
    const result = this.validationManager.validate();

    if (result.ok) {
      // Inject MetricsCollector into resolver after validation (if available)
      this.injectMetricsCollector();
    }

    return result;
  }

  /**
   * Injects MetricsCollector into resolver and cache after validation.
   * This enables metrics recording without circular dependencies during bootstrap.
   *
   * Note: EnvironmentConfig is already injected via BootstrapPerformanceTracker
   * during container creation, so only MetricsCollector needs to be injected here.
   *
   * Static import is safe here because:
   * - tokenindex.ts only uses `import type { ServiceContainer }` (removed at runtime)
   * - No circular runtime dependency exists
   * - Container is already validated when this is called
   */
  private injectMetricsCollector(): void {
    const metricsResult = this.resolutionManager.resolveWithError(metricsCollectorToken);
    if (metricsResult.ok) {
      const metricsCollector = castResolvedService<MetricsCollector>(metricsResult.value);
      this.metricsInjectionManager.performInjection(metricsCollector);
    }
  }

  /**
   * Get validation state.
   * Implements both Container.getValidationState and PlatformContainerPort.getValidationState.
   * Both interfaces use identical types, so a single overload is sufficient.
   */
  getValidationState(): ContainerValidationState | DomainContainerValidationState {
    return this.validationManager.getValidationState() as DomainContainerValidationState;
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
   * const container = ServiceContainer.createRoot(ENV);
   * // ... register services
   * await container.validateAsync(); // Safe for concurrent calls
   * await container.validateAsync(5000); // With 5 second timeout
   * ```
   */
  async validateAsync(timeoutMs: number = 30000): Promise<Result<void, ContainerError[]>> {
    const result = await this.validationManager.validateAsync(timeoutMs, withTimeout, TimeoutError);

    // Inject MetricsCollector if validation succeeded
    if (result.ok) {
      this.injectMetricsCollector();
    }

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
   * const parent = ServiceContainer.createRoot(ENV);
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
    // Validate scope creation
    const scopeResult = this.scopeFacade.validateScopeCreation(name);
    if (!scopeResult.ok) {
      return err(scopeResult.error);
    }

    // Build child container components
    const childRegistry = this.registry.clone();
    const childCache = scopeResult.value.cache;
    const childManager = scopeResult.value.manager;

    // Create performance tracker for child (same as root)
    // Use ENV from parent container (stored during createRoot)
    const childPerformanceTracker = new BootstrapPerformanceTracker(
      createRuntimeConfig(this.env),
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
    // Child inherits ENV from parent
    const child = new ServiceContainer(
      childRegistry,
      this.validator, // Shared (stateless)
      childCache,
      childResolver,
      childManager,
      "registering", // Child starts in registering state
      this.env // Inherit ENV from parent
    );

    return ok(child);
  }

  /**
   * Resolve service with Result return.
   * Implements both Container.resolveWithError and PlatformContainerPort.resolveWithError.
   */
  resolveWithError<T>(token: DomainInjectionToken<T>): Result<T, DomainContainerError>;
  resolveWithError<T>(token: InjectionToken<T>): Result<T, ContainerError>;
  resolveWithError<T>(
    token: InjectionToken<T>
  ): Result<T, ContainerError> | Result<unknown, DomainContainerError> {
    return this.resolutionManager.resolveWithError(token);
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
  resolve<T>(token: ApiSafeToken<T>): T;

  /**
   * @deprecated Internal code must use resolveWithError()
   * @internal This overload prevents direct calls with non-branded tokens
   */
  resolve<T>(token: InjectionToken<T>): never;

  // Implementation (unified for both overloads)
  resolve<T>(token: InjectionToken<T> | ApiSafeToken<T>): T {
    // 🛡️ RUNTIME GUARD (always active for defense-in-depth)
    const securityResult = this.apiSecurityManager.validateApiSafeToken(token);
    if (!securityResult.ok) {
      throw new Error(securityResult.error.message);
    }

    // Standard resolution via Result pattern
    return this.resolutionManager.resolve(token);
  }

  /**
   * Check if service is registered.
   * Implements both Container.isRegistered and PlatformContainerPort.isRegistered.
   */
  isRegistered<T>(token: DomainInjectionToken<T>): Result<boolean, never>;
  isRegistered<T>(token: InjectionToken<T>): Result<boolean, never>;
  isRegistered<T>(token: InjectionToken<T>): Result<boolean, never> {
    return ok(this.registrationManager.isRegistered(token));
  }

  /**
   * Returns API-safe token metadata for external consumption.
   */
  getApiSafeToken<T>(
    token: ApiSafeToken<T>
  ): { description: string; isRegistered: boolean } | null {
    if (!isApiSafeTokenRuntime(token)) {
      return null;
    }

    return {
      description: String(token),
      isRegistered: this.registrationManager.isRegistered(token),
    };
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
      this.validationManager.resetValidationState();
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
      this.validationManager.resetValidationState();
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
    this.validationManager.resetValidationState(); // Critical: reset validation state
    return ok(undefined);
  }
}
