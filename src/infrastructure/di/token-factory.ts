/**
 * Token factory for creating type-safe injection tokens.
 *
 * This utility function is part of the Infrastructure Layer for dependency injection.
 * The function creates unique, type-safe injection tokens for dependency injection.
 * Each call creates a new Symbol, ensuring uniqueness even with the same description.
 */
import type { InjectionToken } from "@/infrastructure/di/types/core/injectiontoken";

/**
 * Creates a unique, type-safe injection token for dependency injection.
 * Each call creates a new Symbol, ensuring uniqueness even with the same description.
 *
 * @template Tunknown - The type of service this token represents
 * @param description - A descriptive name for debugging purposes (appears in DevTools)
 * @returns A unique Symbol branded with the service type
 *
 * @example
 * ```typescript
 * // Create tokens for different services
 * const LoggerToken = createInjectionToken<Logger>('Logger');
 * const DatabaseToken = createInjectionToken<Database>('Database');
 *
 * // Tokens can be used with a DI container
 * container.register(LoggerToken, new Logger());
 * ```
 */
export function createInjectionToken<T>(description: string): InjectionToken<T> {
  return Symbol(description) as InjectionToken<T>;
}
