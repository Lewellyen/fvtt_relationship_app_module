import type { Result } from "@/domain/types/result";
import type { InjectionToken } from "../types/core/injectiontoken";
import type { ContainerError } from "../interfaces";

/**
 * Interface for resolving dependencies by token.
 *
 * This interface breaks the circular dependency between ServiceResolver
 * and ServiceInstantiator by providing an abstraction that ServiceInstantiator
 * can depend on instead of the concrete ServiceResolver class.
 *
 * ServiceResolver implements this interface, allowing it to be passed to
 * ServiceInstantiator without creating a circular dependency.
 *
 * @interface DependencyResolver
 */
export interface DependencyResolver {
  /**
   * Resolves a dependency by token.
   *
   * @template T - The type of service to resolve
   * @param token - The injection token identifying the service
   * @returns Result with service instance or error
   */
  resolve<T>(token: InjectionToken<T>): Result<T, ContainerError>;
}

