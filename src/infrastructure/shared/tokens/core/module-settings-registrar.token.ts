/**
 * Injection token for the ModuleSettingsRegistrar.
 *
 * Uses type-only import to prevent circular dependencies while maintaining type safety.
 * TypeScript removes type imports at compile time, so they don't create runtime dependencies.
 */
import { createInjectionToken } from "@/infrastructure/di/token-factory";
import type { ModuleSettingsRegistrar } from "@/application/services/ModuleSettingsRegistrar";

/**
 * Injection token for the ModuleSettingsRegistrar.
 *
 * Manages registration of all Foundry module settings.
 * Must be called during or after the 'init' hook.
 *
 * @example
 * ```typescript
 * const settingsRegistrar = container.resolve(moduleSettingsRegistrarToken);
 * settingsRegistrar.registerAll(container);
 * ```
 */
export const moduleSettingsRegistrarToken =
  createInjectionToken<ModuleSettingsRegistrar>("ModuleSettingsRegistrar");
