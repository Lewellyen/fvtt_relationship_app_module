/**
 * Utility function to create type-safe injection tokens for dependency injection.
 */
import type { InjectionToken } from "./injection-token";
import type { ServiceType } from "@/infrastructure/shared/tokens";

/**
 * Creates a unique, type-safe injection token for dependency injection.
 * Each call creates a new Symbol, ensuring uniqueness even with the same description.
 *
 * @template ServiceType - The type of service this token represents
 * @param description - A descriptive name for debugging purposes (appears in DevTools)
 * @returns A unique Symbol branded with the service type
 *
 * @example
 * // Create tokens for different services
 * const LoggerToken = createInjectionToken<Logger>('Logger');
 * const DatabaseToken = createInjectionToken<Database>('Database');
 *
 * // Tokens can be used with a DI container
 * container.register(LoggerToken, new Logger());
 */
export function createInjectionToken<TServiceType extends ServiceType>(
  description: string
): InjectionToken<TServiceType> {
  return Symbol(description) as InjectionToken<TServiceType>;
}
