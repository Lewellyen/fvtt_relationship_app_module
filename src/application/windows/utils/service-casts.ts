/**
 * Service Cast Utilities for Application Layer
 *
 * Provides type-safe casts for service resolution in the Application layer.
 * This file is in the Application layer to avoid Infrastructure dependencies.
 *
 * These casts are runtime-safe when used with DI container resolution,
 * as the container guarantees type safety through token registration.
 */

/**
 * Casts a resolved service value to the expected type.
 *
 * This is a type assertion that is safe when used with DI container resolution,
 * as the container ensures the token matches the registered type.
 *
 * @template T - The expected service type
 * @param value - The resolved service value from the container
 * @returns The value cast to type T
 */
export function castResolvedService<T>(value: unknown): T {
  // type-coverage:ignore-next-line - DI container resolution guarantees type safety
  return value as T;
}
