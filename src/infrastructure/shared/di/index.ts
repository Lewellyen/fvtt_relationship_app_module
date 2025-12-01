/**
 * Shared dependency injection utilities.
 *
 * This module provides type-safe utilities for creating injection tokens
 * that can be used across all layers (Application, Infrastructure, Framework)
 * without violating the Dependency Inversion Principle.
 *
 * By placing these utilities in the shared infrastructure area, we allow
 * the Application layer to create tokens without depending on concrete
 * Infrastructure implementations.
 */
export { createInjectionToken } from "./token-utilities";
export type { InjectionToken } from "./injection-token";
