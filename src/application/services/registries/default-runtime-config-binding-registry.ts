/**
 * Default implementation of RuntimeConfigBindingRegistry.
 *
 * Provides all runtime config bindings for settings.
 * This is the migration path from the hardcoded bindings in RuntimeConfigSync.
 */

import type { RuntimeConfigBindingRegistry } from "./runtime-config-binding-registry.interface";
import type { RuntimeConfigKey } from "@/domain/types/runtime-config";
import type { RuntimeConfigBinding } from "@/application/services/RuntimeConfigSync";
import { castBindingToUnknown } from "@/application/utils/registry-casts";
import { runtimeConfigBindings } from "@/application/services/RuntimeConfigSync";

/**
 * Default registry containing all runtime config bindings.
 *
 * Implements Open/Closed Principle: New bindings can be added to the source object
 * without modifying ModuleSettingsRegistrar.
 */
export class DefaultRuntimeConfigBindingRegistry implements RuntimeConfigBindingRegistry {
  getAll(): ReadonlyMap<string, RuntimeConfigBinding<unknown, RuntimeConfigKey>> {
    const map = new Map<string, RuntimeConfigBinding<unknown, RuntimeConfigKey>>();

    // Iterate over runtimeConfigBindings entries and convert each binding
    // Object.entries() returns a union of all binding types, handled by castBindingToUnknown
    Object.entries(runtimeConfigBindings).forEach(([key, binding]) => {
      map.set(key, castBindingToUnknown(binding));
    });

    return map;
  }
}
