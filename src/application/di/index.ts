/**
 * Dependency Injection primitives for the Application layer.
 *
 * This module provides type-safe injection tokens and container types
 * that are used throughout the application for dependency injection.
 *
 * These types were moved from the Domain layer to the Application layer
 * to follow the Dependency Inversion Principle (DIP) and keep DI concerns
 * out of the Domain layer.
 */

export type { InjectionToken } from "./injection-token";
export { createInjectionToken } from "./token-factory";
export type {
  DomainInjectionToken,
  DomainApiSafeToken,
  DomainContainerError,
  DomainContainerValidationState,
} from "./container-types";
