/**
 * Token factory wrapper for Application Layer.
 *
 * This wrapper allows Application Layer to create injection tokens without
 * directly depending on Infrastructure Layer's token factory implementation.
 * This maintains Clean Architecture dependency rules.
 *
 * The wrapper delegates to the Infrastructure Layer's token factory,
 * but provides an Application Layer abstraction point.
 */
import { createInjectionToken as createInfrastructureToken } from "@/infrastructure/di/token-factory";
import type { InjectionToken } from "@/infrastructure/di/types/core/injectiontoken";

/**
 * Creates a unique, type-safe injection token for dependency injection.
 *
 * This is a wrapper around the Infrastructure Layer's token factory,
 * allowing Application Layer to create tokens without direct Infrastructure dependencies.
 *
 * @template T - The type of service this token represents
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
  return createInfrastructureToken<T>(description);
}
