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
      /* type-coverage:ignore-next-line -- Proxy trap: prop (string | symbol) must be narrowed to keyof T for includes() check */
      if (allowedMethods.includes(prop as keyof T)) {
        const value: unknown = Reflect.get(target, prop, receiver);

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
