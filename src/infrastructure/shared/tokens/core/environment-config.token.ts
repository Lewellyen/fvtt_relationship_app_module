/**
 * Injection token for the EnvironmentConfig.
 *
 * Uses type-only import to prevent circular dependencies while maintaining type safety.
 * TypeScript removes type imports at compile time, so they don't create runtime dependencies.
 */
import { createInjectionToken } from "@/infrastructure/di/token-factory";
import type { EnvironmentConfig } from "@/domain/types/environment-config";

/**
 * Injection token for the EnvironmentConfig.
 *
 * Provides access to environment configuration (development/production mode,
 * log levels, performance tracking settings, etc.).
 *
 * Injecting ENV as a service improves testability and follows DIP
 * (Dependency Inversion Principle) by depending on abstraction rather than
 * concrete global state.
 *
 * @example
 * ```typescript
 * export class MyService {
 *   static dependencies = [environmentConfigToken] as const;
 *
 *   constructor(private readonly env: EnvironmentConfig) {}
 *
 *   doSomething() {
 *     if (this.env.isDevelopment) {
 *       // Development-specific logic
 *     }
 *   }
 * }
 * ```
 */
export const environmentConfigToken = createInjectionToken<EnvironmentConfig>("EnvironmentConfig");
