import type { Result } from "@/types/result";
import type { InjectionToken } from "../types/injectiontoken";
import type { ServiceType } from "@/types/servicetypeindex";
import type { ServiceClass } from "../types/serviceclass";
import type { FactoryFunction } from "../types/servicefactory";
import type { ServiceDependencies } from "../types/servicedependencies";
import { ServiceLifecycle } from "../types/servicelifecycle";
import type { ContainerError } from "../interfaces/containererror";
import { ServiceRegistration } from "../types/serviceregistration";
import { ok, err } from "@/utils/result";

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

    const dependencies = (serviceClass as any).dependencies ?? [];

    const registration = new ServiceRegistration(
      lifecycle,
      dependencies,
      "class",
      serviceClass,     // Store the class itself
      undefined,        // factory
      undefined,        // value
      undefined         // aliasTarget
    );

    this.registrations.set(token, registration);
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

    const registration = new ServiceRegistration(
      lifecycle,
      dependencies,
      "factory",
      undefined,        // serviceClass
      factory,          // Store the factory function
      undefined,        // value
      undefined         // aliasTarget
    );

    this.registrations.set(token, registration);
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

    // Runtime check: values must not be functions or classes
    if (typeof value === "function") {
      return err({
        code: "InvalidOperation",
        message:
          "registerValue() only accepts plain values, not classes or functions. Use registerClass() or registerFactory() instead.",
        tokenDescription: String(token),
      });
    }

    const registration = new ServiceRegistration(
      ServiceLifecycle.SINGLETON,
      [],
      "value",
      undefined,        // serviceClass
      undefined,        // factory
      value,            // Store the value
      undefined         // aliasTarget
    );

    this.registrations.set(token, registration);
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

    // Alias resolution is handled by ServiceResolver
    const registration = new ServiceRegistration(
      ServiceLifecycle.SINGLETON,
      [targetToken],
      "alias",
      undefined,        // serviceClass
      undefined,        // factory
      undefined,        // value
      targetToken       // Store alias target
    );

    this.registrations.set(aliasToken, registration);
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
    
    return clonedRegistry;
  }
}

