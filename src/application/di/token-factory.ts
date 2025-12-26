/**
 * Token factory for creating type-safe injection tokens.
 *
 * Diese Funktion ist Teil der DI-Infrastruktur im Application Layer,
 * um Implementierungen aus Infrastructure/Framework mit Domain-Contracts zu verbinden.
 *
 * Die Funktion erstellt eindeutige, typsichere Injection-Tokens für Dependency Injection.
 * Jeder Aufruf erstellt ein neues Symbol, wodurch Eindeutigkeit auch bei gleicher Beschreibung gewährleistet ist.
 */
import type { InjectionToken } from "./injection-token";

/**
 * Creates a unique, type-safe injection token for dependency injection.
 * Each call creates a new Symbol, ensuring uniqueness even with the same description.
 *
 * Teil der DI-Infrastruktur im Application Layer zur Verbindung von
 * Implementierungen (Infrastructure/Framework) mit Domain-Contracts.
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
  return Symbol(description) as InjectionToken<T>;
}
