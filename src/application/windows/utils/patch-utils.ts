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
      // Partial<T>[keyof T] is type-safe, but TypeScript cannot infer the type from Partial
      type ValueType = T[keyof T];
      /* type-coverage:ignore-next-line -- Type narrowing: key validated as keyof T above, updates[typedKey] is T[keyof T] */
      const value = updates[typedKey] as ValueType;
      const currentValue = target[typedKey];
      if (currentValue !== value) {
        // Type-Cast notwendig, da keyof T nicht direkt als Index verwendet werden kann
        (target as Record<keyof T, T[keyof T]>)[typedKey] = value;
        hasChanges = true;
      }
    }
  }

  return hasChanges;
}
