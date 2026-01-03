/**
 * Patch Utilities - Idempotente Patch-Operationen
 *
 * Verhindert unnötige Reaktionen durch idempotente Patches (nur ändern wenn value differs).
 */

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
    // type-coverage:ignore-next-line - Object.prototype.hasOwnProperty ist type-safe, aber type-coverage erkennt prototype nicht
    if (Object.prototype.hasOwnProperty.call(updates, key)) {
      const typedKey = key as keyof T;
      // type-coverage:ignore-next-line - Partial<T>[keyof T] ist type-safe, aber TypeScript kann den Typ nicht aus Partial ableiten
      const value = updates[typedKey] as T[keyof T];
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
