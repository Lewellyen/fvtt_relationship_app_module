/**
 * Patch Utilities - Idempotente Patch-Operationen
 *
 * Verhindert unnötige Reaktionen durch idempotente Patches (nur ändern wenn value differs).
 */

import { hasOwnProperty } from "@/domain/utils/type-guards";

/**
 * ApplyPatch - Wendet Updates idempotent an (nur ändern wenn value differs)
 *
 * @param target - Ziel-Objekt
 * @param updates - Updates
 * @returns true wenn Änderungen vorgenommen wurden, false wenn keine Änderungen
 */
export function applyPatch<T extends Record<string, unknown>>(
  target: T,
  updates: Partial<T>
): boolean {
  let hasChanges = false;

  // Type-safe iteration over Partial<T> keys
  for (const key in updates) {
    if (hasOwnProperty(updates, key)) {
      const typedKey = key as keyof T;
      const value = updates[typedKey];
      const currentValue = target[typedKey];
      if (currentValue !== value) {
        // Partial<T> may yield `undefined` even when T[keyof T] doesn't include it (exactOptionalPropertyTypes).
        // Using Reflect avoids an unsound assignment error while keeping runtime behavior correct.
        Reflect.set(target, typedKey, value);
        hasChanges = true;
      }
    }
  }

  return hasChanges;
}
