/**
 * Interface for setting definition registries.
 *
 * Implements Open/Closed Principle: New settings can be added by extending
 * the registry without modifying ModuleSettingsRegistrar.
 *
 * **Design Rationale:**
 * - Open/Closed: ModuleSettingsRegistrar is closed for modification but open for extension via registries
 * - Single Responsibility: Registry only provides setting definitions
 * - Dependency Inversion: ModuleSettingsRegistrar depends on abstraction, not concrete implementations
 */

import type { SettingDefinition } from "@/application/settings/setting-definition.interface";

/**
 * Registry that provides setting definitions for registration.
 *
 * @see ModuleSettingsRegistrar for usage
 */
export interface SettingDefinitionRegistry {
  /**
   * Returns all setting definitions that should be registered.
   *
   * @returns Array of setting definitions
   */
  getAll(): readonly SettingDefinition<unknown>[];
}
