/**
 * Application-layer types for container operations.
 *
 * These types provide abstractions for dependency injection operations
 * used by the Application and Infrastructure layers.
 *
 * These types are used by Domain-Ports to maintain clean architecture boundaries
 * while keeping DI concerns out of the Domain layer.
 */

/**
 * Base type for dependency injection tokens.
 *
 * This is a minimal abstraction for tokens used in container operations.
 * T is used as a type parameter for generic type constraints,
 * even though it's not directly referenced in the type body.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type DomainInjectionToken<T = unknown> = symbol;

/**
 * Base type for API-safe tokens that can be used with throwing resolve() methods.
 *
 * This is a minimal abstraction for tokens that are safe to use in public APIs.
 */
export type DomainApiSafeToken<T = unknown> = DomainInjectionToken<T>;

/**
 * Base interface for container errors.
 *
 * This is a minimal abstraction for errors that can occur during container operations.
 */
export interface DomainContainerError {
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
 * This is an abstraction that matches the infrastructure
 * implementation to maintain compatibility.
 */
export type DomainContainerValidationState = "registering" | "validating" | "validated";
