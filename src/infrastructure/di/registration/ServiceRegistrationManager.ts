import type { InjectionToken } from "../types/core/injectiontoken";
import type { ServiceClass } from "../types/resolution/serviceclass";
import type { FactoryFunction } from "../types/resolution/servicefactory";
import type { ServiceDependencies } from "../types/resolution/servicedependencies";
import type { ServiceLifecycle } from "../types/core/servicelifecycle";
import type { Result } from "@/domain/types/result";
import type { ContainerError } from "../interfaces";
import type { ContainerValidationState } from "../types/errors/containervalidationstate";
import { ServiceRegistry } from "../registry/ServiceRegistry";
import { err } from "@/domain/utils/result";

/**
 * Manages service registration operations.
 *
 * Responsibilities:
 * - Delegates registration to ServiceRegistry
 * - Validates disposal state before registration
 * - Validates validation state before registration
 *
 * Design:
 * - Pure delegation to ServiceRegistry
 * - State checks (disposal, validation) are responsibility of this manager
 */
export class ServiceRegistrationManager {
  constructor(
    private readonly registry: ServiceRegistry,
    private readonly isDisposed: () => boolean,
    private readonly getValidationState: () => ContainerValidationState
  ) {}

  /**
   * Register a service class with automatic dependency injection.
   */
  registerClass<T>(
    token: InjectionToken<T>,
    serviceClass: ServiceClass<T>,
    lifecycle: ServiceLifecycle
  ): Result<void, ContainerError> {
    if (this.isDisposed()) {
      return err({
        code: "Disposed",
        message: `Cannot register service on disposed container`,
        tokenDescription: String(token),
      });
    }

    if (this.getValidationState() === "validated") {
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
  registerFactory<T>(
    token: InjectionToken<T>,
    factory: FactoryFunction<T>,
    lifecycle: ServiceLifecycle,
    dependencies: ServiceDependencies
  ): Result<void, ContainerError> {
    if (this.isDisposed()) {
      return err({
        code: "Disposed",
        message: `Cannot register service on disposed container`,
        tokenDescription: String(token),
      });
    }

    if (this.getValidationState() === "validated") {
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
  registerValue<T>(token: InjectionToken<T>, value: T): Result<void, ContainerError> {
    if (this.isDisposed()) {
      return err({
        code: "Disposed",
        message: `Cannot register service on disposed container`,
        tokenDescription: String(token),
      });
    }

    if (this.getValidationState() === "validated") {
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
  registerAlias<T>(
    aliasToken: InjectionToken<T>,
    targetToken: InjectionToken<T>
  ): Result<void, ContainerError> {
    if (this.isDisposed()) {
      return err({
        code: "Disposed",
        message: `Cannot register service on disposed container`,
        tokenDescription: String(aliasToken),
      });
    }

    if (this.getValidationState() === "validated") {
      return err({
        code: "InvalidOperation",
        message: "Cannot register after validation",
      });
    }

    return this.registry.registerAlias(aliasToken, targetToken);
  }

  /**
   * Get a registered value without requiring validation.
   * Useful for bootstrap/static values.
   */
  getRegisteredValue<T>(token: InjectionToken<T>): T | null {
    const registration = this.registry.getRegistration(token);
    if (!registration) {
      return null;
    }
    if (registration.providerType !== "value") {
      return null;
    }
    const value = registration.value as T | undefined;
    if (value === undefined) {
      return null;
    }
    return value;
  }

  /**
   * Check if a service is registered.
   */
  isRegistered<T>(token: InjectionToken<T>): boolean {
    return this.registry.has(token);
  }
}
