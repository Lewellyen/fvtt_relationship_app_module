import type { ServiceType } from "@/infrastructure/shared/tokens";
import type { InjectionToken } from "@/infrastructure/di/types/core/injectiontoken";
import type { ApiSafeToken } from "@/infrastructure/di/types/utilities/api-safe-token";
import type { ContainerError } from "@/infrastructure/di/interfaces";
import type { ContainerValidationState } from "@/infrastructure/di/types/errors/containervalidationstate";
import type { Result } from "@/domain/types/result";

/**
 * Minimal port interface for container operations needed by the Framework layer.
 *
 * This interface provides only the essential methods required for service resolution
 * and validation state checking, keeping the Framework layer decoupled from the
 * full Container implementation.
 *
 * **Design Rationale:**
 * - Follows Interface Segregation Principle (ISP)
 * - Framework layer only depends on what it needs
 * - Enables easy testing with lightweight mocks
 * - Allows alternative container implementations in the future
 *
 * @example
 * ```typescript
 * class MyFrameworkService {
 *   constructor(private readonly container: ContainerPort) {}
 *
 *   initialize(): Result<void, string> {
 *     const loggerResult = this.container.resolveWithError(loggerToken);
 *     if (!loggerResult.ok) {
 *       return err(loggerResult.error.message);
 *     }
 *     loggerResult.value.info("Initialized");
 *     return ok(undefined);
 *   }
 * }
 * ```
 */
export interface ContainerPort {
  /**
   * Resolve a service instance with explicit error handling.
   *
   * Returns a Result instead of throwing, allowing for functional error handling.
   *
   * @template T - The type of service to resolve
   * @param token - The injection token that identifies the service
   * @returns Result with the resolved service or error
   */
  resolveWithError<T extends ServiceType>(token: InjectionToken<T>): Result<T, ContainerError>;

  /**
   * Resolve a service instance by its injection token.
   *
   * Throws an error if the service is not registered or resolution fails.
   * Use `resolveWithError()` for error handling without exceptions.
   *
   * @template T - The type of service to resolve
   * @param token - The injection token that identifies the service (must be API-safe)
   * @returns The resolved service instance
   * @throws {ContainerError} If service is not registered or resolution fails
   */
  resolve<T extends ServiceType>(token: ApiSafeToken<T>): T;

  /**
   * Check if a token is registered in this container.
   *
   * @param token - The injection token to check
   * @returns True if the token is registered
   */
  isRegistered<T extends ServiceType>(token: InjectionToken<T>): Result<boolean, never>;

  /**
   * Get the current validation state of the container.
   *
   * @returns Current validation state
   */
  getValidationState(): ContainerValidationState;
}
