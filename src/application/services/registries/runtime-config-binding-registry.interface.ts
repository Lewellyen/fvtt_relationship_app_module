/**
 * Interface for runtime config binding registries.
 *
 * Implements Open/Closed Principle: New bindings can be added by extending
 * the registry without modifying ModuleSettingsRegistrar.
 *
 * **Design Rationale:**
 * - Open/Closed: ModuleSettingsRegistrar is closed for modification but open for extension via registries
 * - Single Responsibility: Registry only provides runtime config bindings
 * - Dependency Inversion: ModuleSettingsRegistrar depends on abstraction, not concrete implementations
 */

import type { RuntimeConfigKey } from "@/domain/types/runtime-config";
import type { RuntimeConfigBinding } from "@/application/services/RuntimeConfigSync";

/**
 * Registry that provides runtime config bindings for settings.
 *
 * Bindings map setting keys to their corresponding runtime config keys,
 * enabling synchronization between Foundry Settings and RuntimeConfigService.
 *
 * @see ModuleSettingsRegistrar for usage
 */
export interface RuntimeConfigBindingRegistry {
  /**
   * Returns all runtime config bindings that should be used.
   *
   * @returns Array of runtime config bindings, keyed by setting key
   */
  getAll(): ReadonlyMap<string, RuntimeConfigBinding<unknown, RuntimeConfigKey>>;
}
