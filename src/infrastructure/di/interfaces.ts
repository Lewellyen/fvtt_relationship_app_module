import type { InjectionToken } from "./types/core/injectiontoken";
import type { ApiSafeToken } from "./types/utilities/api-safe-token";
import type { ServiceLifecycle } from "./types/core/servicelifecycle";
import type { ServiceClass } from "./types/resolution/serviceclass";
import type { FactoryFunction } from "./types/resolution/servicefactory";
import type { ServiceDependencies } from "./types/resolution/servicedependencies";
import type { ContainerValidationState } from "./types/errors/containervalidationstate";
import type { Result } from "@/domain/types/result";
import type { ContainerErrorCode } from "./types/errors/containererrorcode";

/**
 * Structured error information for container operations.
 * Provides detailed error context for debugging and error handling.
 *
 * @interface ContainerError
 *
 * @example
 * ```typescript
 * const error: ContainerError = {
 *   code: "TokenNotRegistered",
 *   message: "Service LoggerToken was not registered",
 *   tokenDescription: "LoggerToken",
 *   timestamp: Date.now(),
 *   containerScope: "root",
 * };
 * ```
 */
export interface ContainerError {
  /** Error code classifying the type of error */
  code: ContainerErrorCode;

  /** Human-readable error message */
  message: string;

  /** Optional underlying error or exception that caused this error */
  cause?: unknown;

  /** Optional description of the token associated with this error */
  tokenDescription?: string;

  /** Optional additional error context (e.g., failed children in PartialDisposal) */
  details?: unknown;

  /** Optional stack trace for error origin tracking */
  stack?: string;

  /** Optional timestamp when error occurred (milliseconds since epoch) */
  timestamp?: number;

  /** Optional container scope where error occurred (e.g., "root", "child-1") */
  containerScope?: string;
}

/**
 * Interface for services that need synchronous cleanup when their scope is disposed.
 * Services implementing this interface will automatically have their dispose() method called
 * when the container's dispose() or disposeAsync() method is invoked.
 *
 * Follows TC39 Explicit Resource Management standard.
 *
 * @interface Disposable
 *
 * @example
 * ```typescript
 * class EventListenerService implements Disposable {
 *   private listeners: Map<string, Function> = new Map();
 *
 *   dispose(): void {
 *     // Synchronous cleanup
 *     this.listeners.clear();
 *     removeAllEventListeners();
 *   }
 * }
 * ```
 *
 * @see AsyncDisposable for asynchronous cleanup
 * @see https://github.com/tc39/proposal-explicit-resource-management
 */
export interface Disposable {
  /**
   * Perform synchronous cleanup operations.
   * This method is automatically called when the container is disposed.
   */
  dispose(): void;
}

/**
 * Interface for services that need asynchronous cleanup when their scope is disposed.
 * Services implementing this interface will automatically have their disposeAsync() method called
 * when the container's disposeAsync() method is invoked.
 *
 * Use this interface for resources that require async operations during cleanup,
 * such as database connections, file handles, or network sockets.
 *
 * Follows TC39 Explicit Resource Management standard.
 *
 * @interface AsyncDisposable
 *
 * @example
 * ```typescript
 * class DatabaseConnection implements AsyncDisposable {
 *   private connection: DbConnection;
 *
 *   async disposeAsync(): Promise<void> {
 *     // Asynchronous cleanup
 *     await this.connection.close();
 *     await this.flushBuffers();
 *   }
 * }
 * ```
 *
 * @see Disposable for synchronous cleanup
 * @see https://github.com/tc39/proposal-explicit-resource-management
 */
export interface AsyncDisposable {
  /**
   * Perform asynchronous cleanup operations.
   * This method must be awaited to ensure cleanup completes before proceeding.
   */
  disposeAsync(): Promise<void>;
}

/**
 * Interface for service registration operations.
 * Segregated from Container to follow Interface Segregation Principle.
 *
 * @interface ServiceRegistrar
 *
 * @example
 * ```typescript
 * function registerServices(registrar: ServiceRegistrar) {
 *   registrar.registerClass(LoggerToken, Logger, SINGLETON);
 *   registrar.registerFactory(DatabaseToken, () => new Database(), SINGLETON);
 * }
 * ```
 */
export interface ServiceRegistrar {
  /**
   * Register a service class with automatic dependency injection.
   *
   * The service class should have a static `dependencies` property that declares its dependencies.
   * The container will automatically resolve and inject these dependencies when creating instances.
   *
   * @template T - The type of service to register
   * @param token - The injection token that identifies this service
   * @param serviceClass - The service class to instantiate (must have static dependencies property)
   * @param lifecycle - Service lifecycle strategy (SINGLETON, TRANSIENT, or SCOPED)
   * @returns Result indicating success or registration error
   */
  registerClass<T>(
    token: InjectionToken<T>,
    serviceClass: ServiceClass<T>,
    lifecycle: ServiceLifecycle
  ): Result<void, ContainerError>;

  /**
   * Register a factory function that creates service instances.
   *
   * Factory functions provide full control over instance creation, including complex initialization
   * logic, conditional creation, or integration with external systems.
   *
   * @template T - The type this factory creates
   * @param token - The injection token that identifies this service
   * @param factory - Factory function that creates the service instance
   * @param lifecycle - Service lifecycle strategy (SINGLETON, TRANSIENT, or SCOPED)
   * @param dependencies - Optional explicit dependencies declaration
   * @returns Result indicating success or registration error
   */
  registerFactory<T>(
    token: InjectionToken<T>,
    factory: FactoryFunction<T>,
    lifecycle: ServiceLifecycle,
    dependencies?: ServiceDependencies
  ): Result<void, ContainerError>;

  /**
   * Register a pre-created instance as a singleton service.
   *
   * Useful for registering instances created outside the container (e.g., from external libraries)
   * or for testing with mock instances.
   *
   * @template T - The type of the instance
   * @param token - The injection token that identifies this service
   * @param instance - The pre-created instance to register
   * @returns Result indicating success or registration error
   */
  registerInstance<T>(token: InjectionToken<T>, instance: T): Result<void, ContainerError>;
}

/**
 * Interface for service resolution operations.
 * Segregated from Container to follow Interface Segregation Principle.
 *
 * @interface ServiceResolver
 *
 * @example
 * ```typescript
 * function resolveService<T>(resolver: ServiceResolver, token: InjectionToken<T>): T {
 *   return resolver.resolve(token);
 * }
 * ```
 */
export interface ServiceResolver {
  /**
   * Resolve a service instance by its injection token.
   *
   * Throws an error if the service is not registered or resolution fails.
   * Use `resolveWithError()` for error handling without exceptions.
   *
   * @template T - The type of service to resolve
   * @param token - The injection token that identifies the service
   * @returns The resolved service instance
   * @throws {ContainerError} If service is not registered or resolution fails
   */
  resolve<T>(token: InjectionToken<T>): T;

  /**
   * Resolve a service instance with explicit error handling.
   *
   * Returns a Result instead of throwing, allowing for functional error handling.
   *
   * @template T - The type of service to resolve
   * @param token - The injection token that identifies the service
   * @returns Result with the resolved service or error
   */
  resolveWithError<T>(token: InjectionToken<T>): Result<T, ContainerError>;
}

/**
 * Interface for container validation operations.
 * Segregated from Container to follow Interface Segregation Principle.
 *
 * @interface ContainerValidator
 *
 * @example
 * ```typescript
 * function validateContainer(validator: ContainerValidator): Result<void, ContainerError[]> {
 *   return validator.validate();
 * }
 * ```
 */
export interface ContainerValidator {
  /**
   * Validate the container's dependency graph.
   *
   * Checks for:
   * - Circular dependencies
   * - Missing dependencies
   * - Invalid factory functions
   *
   * @returns Result indicating validation success or errors
   */
  validate(): Result<void, ContainerError[]>;

  /**
   * Get the current validation state of the container.
   *
   * @returns Current validation state
   */
  getValidationState(): ContainerValidationState;
}

/**
 * Interface for container scope management operations.
 * Segregated from Container to follow Interface Segregation Principle.
 *
 * @interface ScopeManager
 *
 * @example
 * ```typescript
 * function createChildScope(manager: ScopeManager): Result<Container, ContainerError> {
 *   return manager.createScope("child");
 * }
 * ```
 */
export interface ScopeManager {
  /**
   * Create a child container with its own scope.
   *
   * Child containers inherit all registrations from the parent but can register
   * additional services. When the parent is disposed, all children are automatically disposed.
   *
   * @param scopeName - Optional name for the child scope (for debugging)
   * @returns Result with the child container or error
   */
  createScope(scopeName?: string): Result<Container, ContainerError>;
}

/**
 * Interface for container lifecycle management (disposal operations).
 * Segregated from Container to follow Interface Segregation Principle.
 *
 * Note: This is different from the Disposable interface for services.
 * This interface is for the container itself, not for services registered in it.
 *
 * @interface ContainerDisposable
 *
 * @example
 * ```typescript
 * async function cleanupContainer(disposable: ContainerDisposable): Promise<void> {
 *   await disposable.disposeAsync();
 * }
 * ```
 */
export interface ContainerDisposable {
  /**
   * Dispose of the container and all registered services.
   *
   * Calls dispose() on all services implementing Disposable interface.
   * Also disposes all child containers.
   *
   * @returns Result indicating success or disposal errors
   */
  dispose(): Result<void, ContainerError>;

  /**
   * Dispose of the container and all registered services asynchronously.
   *
   * Calls disposeAsync() on all services implementing AsyncDisposable interface,
   * and dispose() on services implementing Disposable interface.
   * Also disposes all child containers.
   *
   * @returns Promise with Result indicating success or disposal errors
   */
  disposeAsync(): Promise<Result<void, ContainerError>>;
}

/**
 * Interface for container query operations.
 * Segregated from Container to follow Interface Segregation Principle.
 *
 * @interface ContainerQuery
 *
 * @example
 * ```typescript
 * function checkRegistration(query: ContainerQuery, token: InjectionToken<unknown>): boolean {
 *   return query.isRegistered(token).value;
 * }
 * ```
 */
export interface ContainerQuery {
  /**
   * Check if a token is registered in this container.
   *
   * @param token - The injection token to check
   * @returns Result with true if the token is registered, false otherwise
   */
  isRegistered<T>(token: InjectionToken<T>): Result<boolean, never>;

  /**
   * Get API-safe token information for external API exposure.
   *
   * @param token - The injection token
   * @returns API-safe token information or null if not registered
   */
  getApiSafeToken<T>(token: ApiSafeToken<T>): { description: string; isRegistered: boolean } | null;
}

/**
 * Main container interface combining all specialized interfaces.
 *
 * This is a composite interface that extends all segregated interfaces,
 * maintaining backward compatibility while following Interface Segregation Principle.
 * Clients can now depend on specific interfaces (e.g., ServiceResolver) instead of
 * the full Container interface when they only need a subset of functionality.
 *
 * @interface Container
 *
 * @example
 * ```typescript
 * // Full container usage (backward compatible)
 * const container: Container = ServiceContainer.createRoot(ENV);
 * container.registerClass(LoggerToken, Logger, SINGLETON);
 * container.validate();
 * const logger = container.resolve(LoggerToken);
 *
 * // Specialized interface usage (ISP-compliant)
 * function resolveService<T>(resolver: ServiceResolver, token: InjectionToken<T>): T {
 *   return resolver.resolve(token);
 * }
 * ```
 */
export interface Container
  extends
    ServiceRegistrar,
    ServiceResolver,
    ContainerValidator,
    ScopeManager,
    ContainerDisposable,
    ContainerQuery {
  // All methods are inherited from the extended interfaces above.
  // This composite interface maintains backward compatibility while
  // allowing clients to depend on specific interfaces (ISP compliance).
}
