import type { ServiceLifecycle } from "./servicelifecycle";
import type { InjectionToken } from "./injectiontoken";
import type { ServiceType } from "@/types/servicetypeindex";
import type { ServiceClass } from "./serviceclass";
import type { FactoryFunction } from "./servicefactory";
import type { Result } from "@/types/result";
import type { ContainerError } from "../interfaces/containererror";
import { ok, err } from "@/utils/functional/result";
import { ServiceLifecycle as SL } from "./servicelifecycle";

/**
 * Represents a service registration in the DI container.
 * Stores all metadata required to create and manage service instances.
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
 */
export class ServiceRegistration {
  /**
   * Private constructor - use static factory methods instead.
   * This prevents direct construction with invalid parameters
   * and ensures Result-based error handling.
   */
  private constructor(
    public readonly lifecycle: ServiceLifecycle,
    public readonly dependencies: readonly InjectionToken<ServiceType>[], // Immutable array
    public readonly providerType: "class" | "factory" | "value" | "alias",

    // Exactly one of these must be set based on providerType:
    public readonly serviceClass?: ServiceClass<ServiceType>,
    public readonly factory?: FactoryFunction<ServiceType>,
    public readonly value?: ServiceType,
    public readonly aliasTarget?: InjectionToken<ServiceType>
  ) {
    // NO validation here - trust factory methods to provide valid data
  }

  /**
   * Creates a class-based registration.
   * @param lifecycle - Service lifecycle (SINGLETON, TRANSIENT, SCOPED)
   * @param dependencies - Array of dependency tokens
   * @param serviceClass - The class to instantiate
   * @returns Result with registration or validation error
   */
  static createClass(
    lifecycle: ServiceLifecycle,
    dependencies: readonly InjectionToken<ServiceType>[],
    serviceClass: ServiceClass<ServiceType>
  ): Result<ServiceRegistration, ContainerError> {
    if (!serviceClass) {
      return err({
        code: "InvalidOperation",
        message: "serviceClass is required for class registration",
      });
    }

    return ok(
      new ServiceRegistration(
        lifecycle,
        dependencies,
        "class",
        serviceClass,
        undefined,
        undefined,
        undefined
      )
    );
  }

  /**
   * Creates a factory-based registration.
   * @param lifecycle - Service lifecycle (SINGLETON, TRANSIENT, SCOPED)
   * @param dependencies - Array of dependency tokens
   * @param factory - Factory function that creates instances
   * @returns Result with registration or validation error
   */
  static createFactory(
    lifecycle: ServiceLifecycle,
    dependencies: readonly InjectionToken<ServiceType>[],
    factory: FactoryFunction<ServiceType>
  ): Result<ServiceRegistration, ContainerError> {
    if (!factory) {
      return err({
        code: "InvalidOperation",
        message: "factory is required for factory registration",
      });
    }

    return ok(
      new ServiceRegistration(
        lifecycle,
        dependencies,
        "factory",
        undefined,
        factory,
        undefined,
        undefined
      )
    );
  }

  /**
   * Creates a value-based registration (always SINGLETON).
   * @param value - The value to register
   * @returns Result with registration or validation error
   */
  static createValue(value: ServiceType): Result<ServiceRegistration, ContainerError> {
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
      new ServiceRegistration(SL.SINGLETON, [], "value", undefined, undefined, value, undefined)
    );
  }

  /**
   * Creates an alias registration (always SINGLETON).
   * @param targetToken - The token to resolve instead
   * @returns Result with registration or validation error
   */
  static createAlias(
    targetToken: InjectionToken<ServiceType>
  ): Result<ServiceRegistration, ContainerError> {
    if (!targetToken) {
      return err({
        code: "InvalidOperation",
        message: "targetToken is required for alias registration",
      });
    }

    return ok(
      new ServiceRegistration(
        SL.SINGLETON,
        [targetToken],
        "alias",
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
  clone(): ServiceRegistration {
    return new ServiceRegistration(
      this.lifecycle,
      [...this.dependencies], // Clone array to prevent shared mutations
      this.providerType,
      this.serviceClass,
      this.factory,
      this.value,
      this.aliasTarget
    );
  }
}
