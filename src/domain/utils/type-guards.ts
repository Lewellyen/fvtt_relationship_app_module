/**
 * Type Guard Utilities for Domain Layer
 *
 * Provides platform-agnostic type guards that can be used across all layers.
 * These utilities have no dependencies and can be safely used in Domain, Application,
 * and Infrastructure layers without violating Clean Architecture principles.
 */

/**
 * Type guard for Record<string, unknown>.
 *
 * Checks if a value is a non-null object (not array) and can be safely cast to Record<string, unknown>.
 * This is useful for validation schemas and runtime type checks.
 *
 * @param value - The value to check
 * @returns true if value is a Record<string, unknown>, false otherwise
 *
 * @example
 * ```typescript
 * const obj = { name: "test" };
 * if (isRecord(obj)) {
 *   console.log(obj.name); // Type-safe access
 * }
 * ```
 */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/**
 * Checks if an object has a property as its own property (not inherited).
 *
 * @param obj - The object to check (unknown type)
 * @param propertyName - The name of the property to check for
 * @returns True if the object has the property as its own property, false otherwise
 *
 * @example
 * ```typescript
 * const obj = { name: "test" };
 * if (hasOwnProperty(obj, "name")) {
 *   console.log(obj.name); // Type-safe
 * }
 * ```
 */
export function hasOwnProperty(obj: unknown, propertyName: string): boolean {
  if (obj === null || obj === undefined || typeof obj !== "object") {
    return false;
  }
  return Object.getOwnPropertyDescriptor(obj, propertyName) !== undefined;
}
