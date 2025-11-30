/**
 * Domain-layer types for container operations.
 *
 * These types provide minimal abstractions for dependency injection operations
 * without depending on infrastructure-layer implementations.
 *
 * Infrastructure-layer types (e.g., InjectionToken, ContainerError) extend
 * or implement these domain types to maintain clean architecture boundaries.
 */

import type { Result } from "./result";

/**
 * Base type constraint for all services that can be registered in a container.
 *
 * This is a minimal domain abstraction. Infrastructure-layer ServiceType
 * extends this constraint.
 */
export type DomainServiceType = unknown;

/**
 * Base type for dependency injection tokens.
 *
 * This is a minimal domain abstraction. Infrastructure-layer InjectionToken
 * extends this type with branded properties.
 */
export type DomainInjectionToken<TServiceType extends DomainServiceType = DomainServiceType> = symbol;

/**
 * Base type for API-safe tokens that can be used with throwing resolve() methods.
 *
 * This is a minimal domain abstraction. Infrastructure-layer ApiSafeToken
 * extends this type with branded properties.
 */
export type DomainApiSafeToken<TServiceType extends DomainServiceType = DomainServiceType> =
  DomainInjectionToken<TServiceType>;

/**
 * Base interface for container errors.
 *
 * This is a minimal domain abstraction. Infrastructure-layer ContainerError
 * extends this interface with additional properties.
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
 * This is a domain-level abstraction that matches the infrastructure
 * implementation to maintain compatibility.
 */
export type DomainContainerValidationState = "registering" | "validating" | "validated";
