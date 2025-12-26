import type { Result } from "@/domain/types/result";

/**
 * Minimal error interface for container operations.
 *
 * This is a domain-level abstraction that doesn't depend on DI infrastructure.
 * Concrete implementations in Infrastructure/Application layers extend this interface.
 */
export interface ContainerError {
  /** Error code classifying the type of error */
  code: string;
  /** Human-readable error message */
  message: string;
  /** Optional underlying error or exception that caused this error */
  cause?: unknown;
}

/**
 * Represents the validation state of a container.
 *
 * This is a domain-level abstraction that matches the infrastructure
 * implementation to maintain compatibility.
 */
export type ContainerValidationState = "registering" | "validating" | "validated";

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
 * - Uses generic `symbol` types instead of DI-specific types to maintain Clean Architecture
 *
 * **Architecture Note:**
 * This port uses generic `symbol` types instead of DI-specific types (like `DomainInjectionToken`)
 * to keep the Domain layer independent of Application/Infrastructure DI concerns.
 * Concrete implementations in Infrastructure layer use DI types from Application layer.
 *
 * @example
 * ```typescript
 * class MyFrameworkService {
 *   constructor(private readonly container: PlatformContainerPort) {}
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
export interface PlatformContainerPort {
  /**
   * Resolve a service instance with explicit error handling.
   *
   * Returns a Result instead of throwing, allowing for functional error handling.
   *
   * @template T - The type of service to resolve
   * @param token - The injection token that identifies the service (generic symbol)
   * @returns Result with the resolved service or error
   */
  resolveWithError<T>(token: symbol): Result<T, ContainerError>;

  /**
   * Resolve a service instance by its injection token.
   *
   * Throws an error if the service is not registered or resolution fails.
   * Use `resolveWithError()` for error handling without exceptions.
   *
   * @template T - The type of service to resolve
   * @param token - The injection token that identifies the service (generic symbol, must be API-safe)
   * @returns The resolved service instance
   * @throws {ContainerError} If service is not registered or resolution fails
   */
  resolve<T>(token: symbol): T;

  /**
   * Check if a token is registered in this container.
   *
   * @param token - The injection token to check (generic symbol)
   * @returns True if the token is registered
   */
  isRegistered(token: symbol): Result<boolean, never>;

  /**
   * Get the current validation state of the container.
   *
   * @returns Current validation state
   */
  getValidationState(): ContainerValidationState;
}
