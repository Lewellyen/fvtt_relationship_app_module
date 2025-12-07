import type { Result } from "@/domain/types/result";
import type { InjectionToken } from "../types/core/injectiontoken";
import type { ContainerError } from "../interfaces";
import type { ServiceRegistration } from "../types/core/serviceregistration";

/**
 * Interface for instantiating services based on registration.
 *
 * This interface breaks the circular dependency between ServiceResolver
 * and lifecycle resolution strategies by providing an abstraction that
 * strategies can depend on instead of the concrete ServiceResolver class.
 *
 * ServiceInstantiatorImpl implements this interface, and ServiceResolver
 * delegates to it, allowing strategies to instantiate services without
 * depending on ServiceResolver directly.
 *
 * @interface ServiceInstantiator
 */
export interface ServiceInstantiator {
  /**
   * Instantiates a service based on registration type.
   *
   * @template T - The type of service to instantiate
   * @param token - The injection token (used for error messages)
   * @param registration - The service registration metadata
   * @returns Result with instance or detailed error (DependencyResolveFailed, FactoryFailed, etc.)
   */
  instantiate<T>(
    token: InjectionToken<T>,
    registration: ServiceRegistration<T>
  ): Result<T, ContainerError>;
}
