/**
 * Injection token for FoundrySettings port.
 *
 * Uses type-only import to prevent circular dependencies while maintaining type safety.
 * TypeScript removes type imports at compile time, so they don't create runtime dependencies.
 */
import { createInjectionToken } from "@/infrastructure/di/token-factory";
import type { FoundrySettingsPort } from "@/infrastructure/adapters/foundry/services/FoundrySettingsPort";

/**
 * Injection token for FoundrySettings port.
 *
 * Provides access to Foundry's settings system for module configuration.
 * Automatically selects version-appropriate port implementation.
 *
 * @example
 * ```typescript
 * const settings = container.resolve(foundrySettingsToken);
 * const logLevel = settings.get("my-module", "logLevel");
 * if (logLevel.ok) {
 *   console.log("Current log level:", logLevel.value);
 * }
 * ```
 */
export const foundrySettingsToken = createInjectionToken<FoundrySettingsPort>("FoundrySettings");
