import type { Result } from "@/domain/types/result";
import type { InjectionToken } from "../types/core/injectiontoken";
import type { ServiceType } from "../types/service-type-registry";
import type { ServiceClass } from "../types/resolution/serviceclass";
import type { FactoryFunction } from "../types/resolution/servicefactory";
import type { ServiceDependencies } from "../types/resolution/servicedependencies";
import { ServiceLifecycle } from "../types/core/servicelifecycle";
import type { ContainerError } from "../interfaces";
import { ServiceRegistration } from "../types/core/serviceregistration";
import { ok, err, isErr } from "@/domain/utils/result";
import { TypeSafeRegistrationMap } from "./TypeSafeRegistrationMap";
import { iterateServiceRegistrationEntries } from "../types/utilities/runtime-safe-cast";

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
 * - Enforce registration limits (DoS protection)
 *
 * This class does NOT handle:
 * - Service resolution (that's ServiceResolver's job)
 * - Dependency validation (that's ContainerValidator's job)
 */
export class ServiceRegistry {
  private readonly MAX_REGISTRATIONS = 10000; // DoS protection: prevent unlimited registrations
  private registrations = new TypeSafeRegistrationMap();
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
    let tokenSet = this.lifecycleIndex.get(lifecycle);
    if (!tokenSet) {
      tokenSet = new Set();
      this.lifecycleIndex.set(lifecycle, tokenSet);
    }
    tokenSet.add(token);
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
    // Check registration limit (DoS protection)
    if (this.registrations.size >= this.MAX_REGISTRATIONS) {
      return err({
        code: "MaxRegistrationsExceeded",
        message: `Cannot register more than ${this.MAX_REGISTRATIONS} services`,
        tokenDescription: String(token),
      });
    }

    if (this.registrations.has(token)) {
      return err({
        code: "DuplicateRegistration",
        message: `Service ${String(token)} already registered`,
        tokenDescription: String(token),
      });
    }

    // Validate serviceClass before using it
    if (!serviceClass) {
      return err({
        code: "InvalidOperation",
        message: "serviceClass is required for class registration",
      });
    }

    const dependencies = hasDependencies(serviceClass) ? (serviceClass.dependencies ?? []) : [];

    // Use static factory method for validation
    const registrationResult = ServiceRegistration.createClass<TServiceType>(
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
    // Check registration limit (DoS protection)
    if (this.registrations.size >= this.MAX_REGISTRATIONS) {
      return err({
        code: "MaxRegistrationsExceeded",
        message: `Cannot register more than ${this.MAX_REGISTRATIONS} services`,
        tokenDescription: String(token),
      });
    }

    if (this.registrations.has(token)) {
      return err({
        code: "DuplicateRegistration",
        message: `Service ${String(token)} already registered`,
        tokenDescription: String(token),
      });
    }

    // Use static factory method for validation
    const registrationResult = ServiceRegistration.createFactory<TServiceType>(
      lifecycle,
      dependencies,
      factory
    );

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
    // Check registration limit (DoS protection)
    if (this.registrations.size >= this.MAX_REGISTRATIONS) {
      return err({
        code: "MaxRegistrationsExceeded",
        message: `Cannot register more than ${this.MAX_REGISTRATIONS} services`,
        tokenDescription: String(token),
      });
    }

    if (this.registrations.has(token)) {
      return err({
        code: "DuplicateRegistration",
        message: `Service ${String(token)} already registered`,
        tokenDescription: String(token),
      });
    }

    // Use static factory method for validation (includes function check)
    const registrationResult = ServiceRegistration.createValue<TServiceType>(value);

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
    // Check registration limit (DoS protection)
    if (this.registrations.size >= this.MAX_REGISTRATIONS) {
      return err({
        code: "MaxRegistrationsExceeded",
        message: `Cannot register more than ${this.MAX_REGISTRATIONS} services`,
        tokenDescription: String(aliasToken),
      });
    }

    if (this.registrations.has(aliasToken)) {
      return err({
        code: "DuplicateRegistration",
        message: `Service ${String(aliasToken)} already registered`,
        tokenDescription: String(aliasToken),
      });
    }

    // Use static factory method for validation
    const registrationResult = ServiceRegistration.createAlias<TServiceType>(targetToken);

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
  ): ServiceRegistration<TServiceType> | undefined {
    return this.registrations.get(token);
  }

  /**
   * Returns all registrations.
   * Used by ContainerValidator for dependency validation.
   *
   * @returns Map of all registrations
   */
  getAllRegistrations(): Map<InjectionToken<ServiceType>, ServiceRegistration> {
    return new Map(iterateServiceRegistrationEntries(this.registrations.entries())); // Defensive copy
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
    for (const [token, registration] of iterateServiceRegistrationEntries(
      this.registrations.entries()
    )) {
      clonedRegistry.registrations.set(token, registration.clone());
    }

    // Clone lifecycle index
    for (const [lifecycle, tokens] of this.lifecycleIndex.entries()) {
      clonedRegistry.lifecycleIndex.set(lifecycle, new Set(tokens));
    }

    return clonedRegistry;
  }
}
