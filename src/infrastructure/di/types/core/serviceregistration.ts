import type { ServiceLifecycle } from "./servicelifecycle";
import type { InjectionToken } from "./injectiontoken";
import type { ServiceType } from "@/infrastructure/shared/tokens";
import type { ServiceClass } from "../resolution/serviceclass";
import type { FactoryFunction, ResultFactoryFunction } from "../resolution/servicefactory";
import type { Result } from "@/domain/types/result";
import type { ContainerError } from "../../interfaces";
import { ok, err } from "@/domain/utils/result";
import { ServiceLifecycle as SL } from "./servicelifecycle";

/**
 * Represents a service registration in the DI container.
 * Stores all metadata required to create and manage service instances.
 *
 * Generic type parameter preserves the concrete service type through registration and resolution,
 * enabling type-safe dependency injection without runtime casts.
 *
 * Design: Uses separate optional fields instead of union type to:
 * - Prevent accidental calls to placeholder alias factories
 * - Make provider type clear and type-safe
 * - Support proper cloning for child scopes
 *
 * Use static factory methods to create instances:
 * - ServiceRegistration.createClass()
 * - ServiceRegistration.createFactory()
 * - ServiceRegistration.createValue()
 * - ServiceRegistration.createAlias()
 *
 * @template TServiceType - The concrete service type being registered
 */
export class ServiceRegistration<TServiceType extends ServiceType = ServiceType> {
  /**
   * Private constructor - use static factory methods instead.
   * This prevents direct construction with invalid parameters
   * and ensures Result-based error handling.
   */
  private constructor(
    public readonly lifecycle: ServiceLifecycle,
    public readonly dependencies: readonly InjectionToken<ServiceType>[], // Immutable array
    public readonly providerType: "class" | "factory" | "resultFactory" | "value" | "alias",

    // Exactly one of these must be set based on providerType:
    public readonly serviceClass?: ServiceClass<TServiceType>,
    public readonly factory?: FactoryFunction<TServiceType>,
    public readonly resultFactory?: ResultFactoryFunction<TServiceType>,
    public readonly value?: TServiceType,
    public readonly aliasTarget?: InjectionToken<TServiceType>
  ) {
    // NO validation here - trust factory methods to provide valid data
  }

  /**
   * Creates a class-based registration.
   * @template TServiceType - The concrete service type
   * @param lifecycle - Service lifecycle (SINGLETON, TRANSIENT, SCOPED)
   * @param dependencies - Array of dependency tokens
   * @param serviceClass - The class to instantiate
   * @returns Result with registration or validation error
   */
  static createClass<TServiceType extends ServiceType>(
    lifecycle: ServiceLifecycle,
    dependencies: readonly InjectionToken<ServiceType>[],
    serviceClass: ServiceClass<TServiceType>
  ): Result<ServiceRegistration<TServiceType>, ContainerError> {
    // Note: serviceClass validation is performed in ServiceRegistry.registerClass before calling this method
    return ok(
      new ServiceRegistration<TServiceType>(
        lifecycle,
        dependencies,
        "class",
        serviceClass,
        undefined,
        undefined,
        undefined,
        undefined
      )
    );
  }

  /**
   * Creates a factory-based registration.
   * @template TServiceType - The concrete service type
   * @param lifecycle - Service lifecycle (SINGLETON, TRANSIENT, SCOPED)
   * @param dependencies - Array of dependency tokens
   * @param factory - Factory function that creates instances
   * @returns Result with registration or validation error
   */
  static createFactory<TServiceType extends ServiceType>(
    lifecycle: ServiceLifecycle,
    dependencies: readonly InjectionToken<ServiceType>[],
    factory: FactoryFunction<TServiceType>
  ): Result<ServiceRegistration<TServiceType>, ContainerError> {
    if (!factory) {
      return err({
        code: "InvalidOperation",
        message: "factory is required for factory registration",
      });
    }

    return ok(
      new ServiceRegistration<TServiceType>(
        lifecycle,
        dependencies,
        "factory",
        undefined,
        factory,
        undefined,
        undefined,
        undefined
      )
    );
  }

  /**
   * Creates a result factory-based registration.
   * This factory returns Result<T, ContainerError> instead of throwing exceptions,
   * adhering to the project's Result Pattern principle.
   * @template TServiceType - The concrete service type
   * @param lifecycle - Service lifecycle (SINGLETON, TRANSIENT, SCOPED)
   * @param dependencies - Array of dependency tokens
   * @param resultFactory - Factory function that returns Result with instance or error
   * @returns Result with registration or validation error
   */
  static createResultFactory<TServiceType extends ServiceType>(
    lifecycle: ServiceLifecycle,
    dependencies: readonly InjectionToken<ServiceType>[],
    resultFactory: ResultFactoryFunction<TServiceType>
  ): Result<ServiceRegistration<TServiceType>, ContainerError> {
    if (!resultFactory) {
      return err({
        code: "InvalidOperation",
        message: "resultFactory is required for result factory registration",
      });
    }

    return ok(
      new ServiceRegistration<TServiceType>(
        lifecycle,
        dependencies,
        "resultFactory",
        undefined,
        undefined,
        resultFactory,
        undefined,
        undefined
      )
    );
  }

  /**
   * Creates a value-based registration (always SINGLETON).
   * @template TServiceType - The concrete service type
   * @param value - The value to register
   * @returns Result with registration or validation error
   */
  static createValue<TServiceType extends ServiceType>(
    value: TServiceType
  ): Result<ServiceRegistration<TServiceType>, ContainerError> {
    if (value === undefined) {
      return err({
        code: "InvalidOperation",
        message: "value cannot be undefined for value registration",
      });
    }

    if (typeof value === "function") {
      return err({
        code: "InvalidOperation",
        message:
          "registerValue() only accepts plain values, not functions or classes. Use registerClass() or registerFactory() instead.",
      });
    }

    return ok(
      new ServiceRegistration<TServiceType>(
        SL.SINGLETON,
        [],
        "value",
        undefined,
        undefined,
        undefined,
        value,
        undefined
      )
    );
  }

  /**
   * Creates an alias registration (always SINGLETON).
   * @template TServiceType - The concrete service type
   * @param targetToken - The token to resolve instead
   * @returns Result with registration or validation error
   */
  static createAlias<TServiceType extends ServiceType>(
    targetToken: InjectionToken<TServiceType>
  ): Result<ServiceRegistration<TServiceType>, ContainerError> {
    if (!targetToken) {
      return err({
        code: "InvalidOperation",
        message: "targetToken is required for alias registration",
      });
    }

    return ok(
      new ServiceRegistration<TServiceType>(
        SL.SINGLETON,
        [targetToken],
        "alias",
        undefined,
        undefined,
        undefined,
        undefined,
        targetToken
      )
    );
  }

  /**
   * Creates a clone of this registration.
   * Used when child containers inherit registrations from parent.
   *
   * @returns A new ServiceRegistration instance with cloned dependencies array
   */
  clone(): ServiceRegistration<TServiceType> {
    return new ServiceRegistration<TServiceType>(
      this.lifecycle,
      [...this.dependencies], // Clone array to prevent shared mutations
      this.providerType,
      this.serviceClass,
      this.factory,
      this.resultFactory,
      this.value,
      this.aliasTarget
    );
  }
}
