import type { ServiceType } from "@/types/servicetypeindex";
import type { InjectionToken } from "@/di_infrastructure/types/injectiontoken";
import type { ServiceLifecycle } from "@/di_infrastructure/types/servicelifecycle";
import type { ServiceClass } from "@/di_infrastructure/types/serviceclass";
import type { FactoryFunction } from "@/di_infrastructure/types/servicefactory";
import type { ServiceDependencies } from "@/di_infrastructure/types/servicedependencies";
import type { ContainerValidationState } from "@/di_infrastructure/types/containervalidationstate";
import type { Result } from "@/types/result";
import type { ContainerError } from "@/di_infrastructure/interfaces/containererror";

export interface Container {
  /**
   * Register a service class with automatic dependency injection.
   *
   * The service class should have a static `dependencies` property that declares its dependencies.
   * The container will automatically resolve and inject these dependencies when creating instances.
   *
   * @template TServiceType - The type of service to register (must extend ServiceType)
   * @param token - The injection token that identifies this service
   * @param serviceClass - The service class to instantiate (must have static dependencies property)
   * @param lifecycle - Service lifecycle strategy (SINGLETON, TRANSIENT, or SCOPED)
   * @returns Result indicating success or registration error
   *
   * @example
   * ```typescript
   * class UserService {
   *   static dependencies = [LoggerToken, DatabaseToken] as const;
   *   constructor(private logger: Logger, private db: Database) {}
   * }
   *
   * const result = container.registerClass(UserServiceToken, UserService, SINGLETON);
   * ```
   */
  registerClass<TServiceType extends ServiceType>(
    token: InjectionToken<TServiceType>,
    serviceClass: ServiceClass<TServiceType>,
    lifecycle: ServiceLifecycle
  ): Result<void, ContainerError>;

  /**
   * Register a factory function that creates service instances.
   *
   * Factory functions provide full control over instance creation, including complex initialization
   * logic, conditional creation, or integration with external systems.
   *
   * @template T - The type this factory creates (no constraints)
   * @param token - The injection token that identifies this service
   * @param factory - Factory function that creates the service instance
   * @param lifecycle - Service lifecycle strategy (SINGLETON, TRANSIENT, or SCOPED)
   * @param dependencies - Array of tokens this factory depends on
   * @returns Result indicating success or registration error
   *
   * @example
   * ```typescript
   * container.registerFactory(
   *   ConfigToken,
   *   () => JSON.parse(fs.readFileSync('config.json')),
   *   SINGLETON,
   *   []
   * );
   * ```
   */
  registerFactory<TServiceType extends ServiceType>(
    token: InjectionToken<TServiceType>,
    factory: FactoryFunction<TServiceType>,
    lifecycle: ServiceLifecycle,
    dependencies: ServiceDependencies
  ): Result<void, ContainerError>;

  /**
   * Register a constant value (always singleton).
   *
   * Use this for configuration values, constants, or pre-instantiated objects.
   * The value must be a plain value, not a class or function.
   *
   * @template T - The type of value (no constraints)
   * @param token - The injection token that identifies this value
   * @param value - The value to register (must not be a function or class)
   * @returns Result indicating success or registration error
   *
   * @example
   * ```typescript
   * container.registerValue(ApiKeyToken, 'secret-key');
   * container.registerValue(PortToken, 8080);
   * container.registerValue(ConfigToken, { apiUrl: 'https://api.com' });
   * ```
   */
  registerValue<TServiceType extends ServiceType>(
    token: InjectionToken<TServiceType>,
    value: TServiceType
  ): Result<void, ContainerError>;

  /**
   * Register an alias that points to another token.
   *
   * Aliases allow multiple tokens to resolve to the same service instance.
   * Useful for providing interfaces alongside implementations.
   *
   * @template TServiceType - The type of service
   * @param aliasToken - The alias token
   * @param targetToken - The token to resolve instead
   * @returns Result indicating success or registration error
   *
   * @example
   * ```typescript
   * container.registerClass(ConsoleLoggerToken, ConsoleLogger, SINGLETON);
   * container.registerAlias(LoggerToken, ConsoleLoggerToken);
   * ```
   */
  registerAlias<TServiceType extends ServiceType>(
    aliasToken: InjectionToken<TServiceType>,
    targetToken: InjectionToken<TServiceType>
  ): Result<void, ContainerError>;

  /**
   * Validate all registered services and their dependencies.
   * 
   * This method performs comprehensive validation:
   * - Checks that all dependencies are registered
   * - Detects circular dependencies
   * - Validates alias targets exist
   * 
   * Must be called before resolve() or createScope().
   * 
   * @returns Result containing array of errors if validation fails, or success if passed
   * 
   * @example
   * ```typescript
   * container.registerClass(UserServiceToken, UserService, SINGLETON);
   * const result = container.validate();
   * if (isErr(result)) {
   *   result.error.forEach(err => console.error(err.message));
   * }
   * ```
   */
  validate(): Result<void, ContainerError[]>;

  /**
   * Get the current validation state of the container.
   *
   * @returns The current validation state ('registering', 'validating', or 'validated')
   */
  getValidationState(): ContainerValidationState;

  /**
   * Create a child container with its own scope.
   * @param name - Optional name for the scope
   */
  createScope(
    name?: string
  ): Result<import("@/di_infrastructure/container").ServiceContainer, ContainerError>;

  /**
   * Resolve a service instance directly from the container.
   * Uses fallback factory if container resolution fails and a fallback is registered.
   *
   * @param token - The injection token identifying the service
   * @returns The resolved service instance
   * @throws Error if container resolution fails and no fallback is registered
   */
  resolve<TServiceType extends ServiceType>(token: InjectionToken<TServiceType>): TServiceType;

  /**
   * Resolve a service instance from the container with explicit error handling.
   * @param token - The injection token identifying the service
   * @returns Result containing the service instance or an error
   */
  resolveWithError<TServiceType extends ServiceType>(
    token: InjectionToken<TServiceType>
  ): Result<TServiceType, ContainerError>;

  /**
   * Check if a service is registered in this container or any parent container.
   * @param token - The injection token to check
   * @returns Result containing true if registered, false otherwise
   */
  isRegistered<TServiceType extends ServiceType>(
    token: InjectionToken<TServiceType>
  ): Result<boolean, never>;

  /**
   * Dispose this container and all child containers.
   * Cascades disposal to all children in the scope hierarchy.
   * @returns Result indicating success or any disposal errors
   */
  dispose(): Result<void, ContainerError>;

  /**
   * Clear all service registrations and instances.
   * Note: Does not dispose child containers or services implementing Disposable.
   * @returns Always succeeds
   */
  clear(): Result<void, never>;
}
