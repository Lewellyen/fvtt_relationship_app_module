/**
 * Type guard to check if a property key is in the allowed methods list.
 * Narrows string | symbol to keyof T by checking against allowed keys.
 *
 * Note: Type predicate returns boolean instead of 'prop is keyof T' because
 * keyof T may include number, which is incompatible with string | symbol parameter.
 * The actual narrowing happens implicitly through the includes() check.
 *
 * @param prop - The property key to check
 * @param allowed - Array of allowed method keys
 * @returns True if prop is a string and in the allowed list
 */
function isAllowedKey<T>(prop: string | symbol, allowed: (keyof T)[]): boolean {
  if (typeof prop !== "string") {
    return false;
  }
  /* type-coverage:ignore-next-line -- Type narrowing: (keyof T)[] to string[] safe when T uses string keys */
  const allowedStrings: string[] = allowed as string[];
  return allowedStrings.includes(prop);
}

/**
 * Creates a read-only proxy wrapper for a service.
 *
 * Only allows access to whitelisted methods. Property access and
 * modifications are blocked to prevent external modules from
 * changing internal state.
 *
 * @param service - The service instance to wrap
 * @param allowedMethods - Array of method names that are allowed to be called
 * @returns Proxied service that only allows whitelisted methods
 *
 * @example
 * ```typescript
 * const publicLogger = createReadOnlyWrapper(logger, [
 *   "debug", "info", "warn", "error"
 * ]);
 *
 * publicLogger.info("Hello");  // ✅ OK
 * publicLogger.setMinLevel(0); // ❌ Error: "setMinLevel is not accessible"
 * publicLogger.minLevel = 0;   // ❌ Error: "Cannot modify service"
 * ```
 */
export function createReadOnlyWrapper<T extends object>(
  service: T,
  allowedMethods: (keyof T)[]
): T {
  return new Proxy(service, {
    get(target, prop, receiver: unknown) {
      // Allow whitelisted methods only
      if (isAllowedKey(prop, allowedMethods)) {
        /* type-coverage:ignore-next-line -- Type narrowing: allowedMethods membership ensures prop is keyof T */
        const value: unknown = Reflect.get(target, prop as keyof T, receiver);

        // Bind 'this' context for methods
        if (typeof value === "function") {
          return value.bind(target);
        }

        return value;
      }

      // Block non-whitelisted property access
      throw new Error(
        `Property "${String(prop)}" is not accessible via Public API. ` +
          `Only these methods are allowed: ${allowedMethods.map(String).join(", ")}`
      );
    },

    set() {
      // Block all property modifications
      throw new Error("Cannot modify services via Public API (read-only)");
    },

    deleteProperty() {
      // Block property deletion
      throw new Error("Cannot delete properties via Public API (read-only)");
    },
  });
}
