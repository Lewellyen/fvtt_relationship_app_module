/**
 * Type-Guard-Utilities for runtime type checking.
 *
 * These utilities provide safe runtime validation for objects and their properties/methods,
 * used by runtime cast functions to ensure type safety at runtime.
 */

import type { Initializable } from "@/domain/ports/initializable.interface";

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && value !== undefined && typeof value === "object";
}

/**
 * Checks if an object has a method with the given name.
 *
 * @param obj - The object to check (unknown type)
 * @param methodName - The name of the method to check for
 * @returns True if the object has the method, false otherwise
 *
 * @example
 * ```typescript
 * const obj = { dispose: () => {} };
 * if (hasMethod(obj, "dispose")) {
 *   obj.dispose(); // Type-safe
 * }
 * ```
 */
export function hasMethod(obj: unknown, methodName: string): boolean {
  if (!isRecord(obj) || !(methodName in obj)) {
    return false;
  }
  return typeof obj[methodName] === "function";
}

/**
 * Checks if an object has a property with the given name.
 *
 * @param obj - The object to check (unknown type)
 * @param propertyName - The name of the property to check for
 * @returns True if the object has the property, false otherwise
 *
 * @example
 * ```typescript
 * const obj = { name: "test" };
 * if (hasProperty(obj, "name")) {
 *   console.log(obj.name); // Type-safe
 * }
 * ```
 */
export function hasProperty(obj: unknown, propertyName: string): boolean {
  return obj !== null && obj !== undefined && typeof obj === "object" && propertyName in obj;
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

/**
 * Checks if an object has all the required methods.
 *
 * @param obj - The object to check (unknown type)
 * @param methodNames - Array of method names that must exist
 * @returns True if the object has all required methods, false otherwise
 *
 * @example
 * ```typescript
 * const obj = { register: () => {}, get: () => {}, set: () => {} };
 * if (isObjectWithMethods(obj, ["register", "get", "set"])) {
 *   // obj has all required methods
 * }
 * ```
 */
export function isObjectWithMethods(obj: unknown, methodNames: string[]): boolean {
  if (obj === null || obj === undefined || typeof obj !== "object") {
    return false;
  }

  return methodNames.every((methodName) => hasMethod(obj, methodName));
}

/**
 * Type guard to check if an object implements the Initializable interface.
 *
 * This follows the Liskov Substitution Principle (LSP) by checking for behavior
 * (the presence of an initialize method) rather than concrete class types.
 *
 * @param obj - The object to check (unknown type)
 * @returns True if the object implements Initializable, false otherwise
 *
 * @example
 * ```typescript
 * const collector = container.resolve(metricsCollectorToken);
 * if (isInitializable(collector)) {
 *   collector.initialize(); // Type-safe
 * }
 * ```
 */
export function isInitializable(obj: unknown): obj is Initializable {
  return hasMethod(obj, "initialize");
}
