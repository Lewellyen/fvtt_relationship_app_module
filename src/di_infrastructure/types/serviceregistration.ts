import type { ServiceLifecycle } from "./servicelifecycle";
import type { InjectionToken } from "./injectiontoken";
import type { ServiceType } from "@/types/servicetypeindex";
import type { ServiceClass } from "./serviceclass";
import type { FactoryFunction } from "./servicefactory";

/**
 * Represents a service registration in the DI container.
 * Stores all metadata required to create and manage service instances.
 * 
 * Design: Uses separate optional fields instead of union type to:
 * - Prevent accidental calls to placeholder alias factories
 * - Make provider type clear and type-safe
 * - Support proper cloning for child scopes
 */
export class ServiceRegistration {
  constructor(
    public readonly lifecycle: ServiceLifecycle,
    public readonly dependencies: readonly InjectionToken<ServiceType>[], // Immutable array
    public readonly providerType: "class" | "factory" | "value" | "alias",
    
    // Exactly one of these must be set based on providerType:
    public readonly serviceClass?: ServiceClass<ServiceType>,
    public readonly factory?: FactoryFunction<ServiceType>,
    public readonly value?: ServiceType,
    public readonly aliasTarget?: InjectionToken<ServiceType>
  ) {
    // Runtime validation: exactly one field must be set
    const setCount = [serviceClass, factory, value, aliasTarget].filter(x => x !== undefined).length;
    
    if (setCount !== 1) {
      throw new Error(
        `Invalid ServiceRegistration: exactly one of serviceClass, factory, value, or aliasTarget must be set. ` +
        `Got ${setCount} set. ProviderType: ${providerType}`
      );
    }
    
    // Validate that the set field matches providerType
    if (providerType === "class" && !serviceClass) {
      throw new Error(`ProviderType "class" requires serviceClass to be set`);
    }
    if (providerType === "factory" && !factory) {
      throw new Error(`ProviderType "factory" requires factory to be set`);
    }
    if (providerType === "value" && value === undefined) {
      throw new Error(`ProviderType "value" requires value to be set`);
    }
    if (providerType === "alias" && !aliasTarget) {
      throw new Error(`ProviderType "alias" requires aliasTarget to be set`);
    }
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

