import type { Result } from "@/types/result";
import type { InjectionToken } from "../types/injectiontoken";
import type { ServiceType } from "@/types/servicetypeindex";
import type { ServiceClass } from "../types/serviceclass";
import type { FactoryFunction } from "../types/servicefactory";
import type { ServiceDependencies } from "../types/servicedependencies";
import { ServiceLifecycle } from "../types/servicelifecycle";
import type { ContainerError } from "../interfaces/containererror";
import { ServiceRegistration } from "../types/serviceregistration";
import { ok, err, isErr } from "@/utils/result";

/**
 * Type for service classes that declare their dependencies.
 */
type ServiceClassWithDependencies<T extends ServiceType> = ServiceClass<T> & {
  dependencies?: ReadonlyArray<InjectionToken<ServiceType>>;
};

/**
 * Type guard to check if a service class has a dependencies property.
 *
 * @template T - The service type
 * @param cls - The service class to check
 * @returns True if the class has a dependencies property
 */
function hasDependencies<T extends ServiceType>(
  cls: ServiceClass<T>
): cls is ServiceClassWithDependencies<T> {
  return "dependencies" in cls;
}

/**
 * Registry for service registrations.
 *
 * Responsibilities:
 * - Manage service registrations (add, retrieve, check existence)
 * - Validate registrations (no duplicates, valid values)
 * - Support cloning for child containers
 *
 * This class does NOT handle:
 * - Service resolution (that's ServiceResolver's job)
 * - Dependency validation (that's ContainerValidator's job)
 */
export class ServiceRegistry {
  private registrations = new Map<InjectionToken<ServiceType>, ServiceRegistration>();
  private lifecycleIndex = new Map<ServiceLifecycle, Set<InjectionToken<ServiceType>>>();

  /**
   * Updates the lifecycle index when a service is registered.
   *
   * @param token - The injection token
   * @param lifecycle - The service lifecycle
   */
  private updateLifecycleIndex(
    token: InjectionToken<ServiceType>,
    lifecycle: ServiceLifecycle
  ): void {
    if (!this.lifecycleIndex.has(lifecycle)) {
      this.lifecycleIndex.set(lifecycle, new Set());
    }
    this.lifecycleIndex.get(lifecycle)!.add(token);
  }

  /**
   * Registers a service class with automatic dependency injection.
   *
   * @template TServiceType - The type of service to register
   * @param token - The injection token identifying this service
   * @param serviceClass - The class to instantiate
   * @param lifecycle - Service lifecycle (SINGLETON, TRANSIENT, SCOPED)
   * @returns Result indicating success or error
   */
  registerClass<TServiceType extends ServiceType>(
    token: InjectionToken<TServiceType>,
    serviceClass: ServiceClass<TServiceType>,
    lifecycle: ServiceLifecycle
  ): Result<void, ContainerError> {
    if (this.registrations.has(token)) {
      return err({
        code: "DuplicateRegistration",
        message: `Service ${String(token)} already registered`,
        tokenDescription: String(token),
      });
    }

    const dependencies = hasDependencies(serviceClass) ? (serviceClass.dependencies ?? []) : [];

    // Use static factory method for validation
    const registrationResult = ServiceRegistration.createClass(
      lifecycle,
      dependencies,
      serviceClass
    );

    if (isErr(registrationResult)) {
      return registrationResult;
    }

    this.registrations.set(token, registrationResult.value);
    this.updateLifecycleIndex(token, lifecycle);
    return ok(undefined);
  }

  /**
   * Registers a factory function for creating service instances.
   *
   * @template TServiceType - The type of service this factory creates
   * @param token - The injection token identifying this service
   * @param factory - Factory function that creates instances
   * @param lifecycle - Service lifecycle (SINGLETON, TRANSIENT, SCOPED)
   * @param dependencies - Array of tokens this factory depends on
   * @returns Result indicating success or error
   */
  registerFactory<TServiceType extends ServiceType>(
    token: InjectionToken<TServiceType>,
    factory: FactoryFunction<TServiceType>,
    lifecycle: ServiceLifecycle,
    dependencies: ServiceDependencies
  ): Result<void, ContainerError> {
    if (this.registrations.has(token)) {
      return err({
        code: "DuplicateRegistration",
        message: `Service ${String(token)} already registered`,
        tokenDescription: String(token),
      });
    }

    // Use static factory method for validation
    const registrationResult = ServiceRegistration.createFactory(lifecycle, dependencies, factory);

    if (isErr(registrationResult)) {
      return registrationResult;
    }

    this.registrations.set(token, registrationResult.value);
    this.updateLifecycleIndex(token, lifecycle);
    return ok(undefined);
  }

  /**
   * Registers a constant value (always SINGLETON lifecycle).
   *
   * @template TServiceType - The type of value to register
   * @param token - The injection token identifying this value
   * @param value - The value to register
   * @returns Result indicating success or error
   */
  registerValue<TServiceType extends ServiceType>(
    token: InjectionToken<TServiceType>,
    value: TServiceType
  ): Result<void, ContainerError> {
    if (this.registrations.has(token)) {
      return err({
        code: "DuplicateRegistration",
        message: `Service ${String(token)} already registered`,
        tokenDescription: String(token),
      });
    }

    // Use static factory method for validation (includes function check)
    const registrationResult = ServiceRegistration.createValue(value);

    if (isErr(registrationResult)) {
      return registrationResult;
    }

    this.registrations.set(token, registrationResult.value);
    this.updateLifecycleIndex(token, ServiceLifecycle.SINGLETON); // Values are always SINGLETON
    return ok(undefined);
  }

  /**
   * Registers an alias that points to another token.
   *
   * @template TServiceType - The type of service
   * @param aliasToken - The alias token
   * @param targetToken - The token to resolve instead
   * @returns Result indicating success or error
   */
  registerAlias<TServiceType extends ServiceType>(
    aliasToken: InjectionToken<TServiceType>,
    targetToken: InjectionToken<TServiceType>
  ): Result<void, ContainerError> {
    if (this.registrations.has(aliasToken)) {
      return err({
        code: "DuplicateRegistration",
        message: `Service ${String(aliasToken)} already registered`,
        tokenDescription: String(aliasToken),
      });
    }

    // Use static factory method for validation
    const registrationResult = ServiceRegistration.createAlias(targetToken);

    if (isErr(registrationResult)) {
      return registrationResult;
    }

    this.registrations.set(aliasToken, registrationResult.value);
    return ok(undefined);
  }

  /**
   * Retrieves a service registration.
   *
   * @template TServiceType - The type of service
   * @param token - The injection token identifying the service
   * @returns The registration or undefined if not found
   */
  getRegistration<TServiceType extends ServiceType>(
    token: InjectionToken<TServiceType>
  ): ServiceRegistration | undefined {
    return this.registrations.get(token);
  }

  /**
   * Returns all registrations.
   * Used by ContainerValidator for dependency validation.
   *
   * @returns Map of all registrations
   */
  getAllRegistrations(): Map<InjectionToken<ServiceType>, ServiceRegistration> {
    return new Map(this.registrations); // Defensive copy
  }

  /**
   * Returns all registrations for a specific lifecycle.
   * More efficient than filtering getAllRegistrations() when only one lifecycle is needed.
   *
   * @param lifecycle - The lifecycle to query
   * @returns Array of registrations with the specified lifecycle
   */
  getRegistrationsByLifecycle(lifecycle: ServiceLifecycle): ServiceRegistration[] {
    const tokens = this.lifecycleIndex.get(lifecycle) ?? new Set();
    return Array.from(tokens)
      .map((token) => this.registrations.get(token))
      .filter((reg): reg is ServiceRegistration => reg !== undefined);
  }

  /**
   * Checks if a service is registered.
   *
   * @template TServiceType - The type of service
   * @param token - The injection token to check
   * @returns True if registered, false otherwise
   */
  has<TServiceType extends ServiceType>(token: InjectionToken<TServiceType>): boolean {
    return this.registrations.has(token);
  }

  /**
   * Clears all registrations.
   * Warning: This removes all configured services.
   */
  clear(): void {
    this.registrations.clear();
    this.lifecycleIndex.clear();
  }

  /**
   * Creates a deep clone of this registry for child containers.
   *
   * Important: Creates a new Map instance with cloned ServiceRegistration objects
   * to prevent child containers from mutating parent registrations.
   *
   * @returns A new ServiceRegistry with cloned registrations
   */
  clone(): ServiceRegistry {
    const clonedRegistry = new ServiceRegistry();

    // Create new Map with cloned ServiceRegistration objects
    for (const [token, registration] of this.registrations.entries()) {
      clonedRegistry.registrations.set(token, registration.clone());
    }

    // Clone lifecycle index
    for (const [lifecycle, tokens] of this.lifecycleIndex.entries()) {
      clonedRegistry.lifecycleIndex.set(lifecycle, new Set(tokens));
    }

    return clonedRegistry;
  }
}
