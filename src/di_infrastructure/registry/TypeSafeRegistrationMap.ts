import type { InjectionToken } from "../types/injectiontoken";
import type { ServiceType } from "@/types/servicetypeindex";
import type { ServiceRegistration } from "../types/serviceregistration";

/**
 * Type-safe wrapper around Map for ServiceRegistrations.
 *
 * Preserves generic type information through token-based lookup, enabling
 * type-safe dependency injection without runtime casts in most cases.
 *
 * Design:
 * - Map stores ServiceRegistration<any> to support heterogeneous service types
 * - Generic methods preserve type information through token's type parameter
 * - Single cast in get() is architecturally sound (token identity guarantees type)
 *
 * @example
 * ```typescript
 * const map = new TypeSafeRegistrationMap();
 * const reg = ServiceRegistration.createClass<Logger>(...);
 * map.set(loggerToken, reg);
 *
 * const retrieved = map.get(loggerToken);
 * // retrieved is ServiceRegistration<Logger> | undefined
 * ```
 */
export class TypeSafeRegistrationMap {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Heterogeneous service types require any storage
  private readonly map: Map<symbol, ServiceRegistration<any>> = new Map();

  /**
   * Stores a service registration.
   *
   * @template T - The concrete service type
   * @param token - The injection token identifying the service
   * @param registration - The service registration metadata
   */
  set<T extends ServiceType>(token: InjectionToken<T>, registration: ServiceRegistration<T>): void {
    this.map.set(token as symbol, registration);
  }

  /**
   * Retrieves a service registration.
   *
   * Type-safe by design: The token's generic parameter guarantees that the
   * returned registration matches the expected service type.
   *
   * @template T - The concrete service type
   * @param token - The injection token identifying the service
   * @returns The service registration or undefined if not found
   */
  get<T extends ServiceType>(token: InjectionToken<T>): ServiceRegistration<T> | undefined {
    // Type-safe by design: Token's generic guarantees registration type
    // Cast is necessary due to Map's type erasure but architecturally sound
    return this.map.get(token as symbol) as ServiceRegistration<T> | undefined;
  }

  /**
   * Checks if a service is registered.
   *
   * @param token - The injection token to check
   * @returns True if the service is registered
   */
  has(token: InjectionToken<ServiceType>): boolean {
    return this.map.has(token as symbol);
  }

  /**
   * Removes a service registration.
   *
   * @param token - The injection token identifying the service
   * @returns True if the service was found and removed
   */
  delete(token: InjectionToken<ServiceType>): boolean {
    return this.map.delete(token as symbol);
  }

  /**
   * Gets the number of registered services.
   *
   * @returns The count of registrations
   */
  get size(): number {
    return this.map.size;
  }

  /**
   * Removes all service registrations.
   */
  clear(): void {
    this.map.clear();
  }

  /**
   * Returns an iterator of all registration entries.
   *
   * @returns Iterator of [token, registration] pairs
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Iterator returns heterogeneous service types
  entries(): IterableIterator<[symbol, ServiceRegistration<any>]> {
    return this.map.entries();
  }

  /**
   * Creates a shallow clone of this map.
   * Used when child containers inherit registrations from parent.
   *
   * @returns A new TypeSafeRegistrationMap with cloned entries
   */
  clone(): TypeSafeRegistrationMap {
    const cloned = new TypeSafeRegistrationMap();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- forEach iterates over heterogeneous service types
    this.map.forEach((value: ServiceRegistration<any>, key: symbol) => {
      cloned.map.set(key, value);
    });
    return cloned;
  }
}
