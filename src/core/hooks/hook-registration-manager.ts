/**
 * Small utility to manage the lifecycle of hook registrations.
 *
 * Callers register cleanup callbacks (typically calling FoundryHooks.off)
 * and can later dispose all registrations in a single place.
 *
 * This avoids duplizierten Code in einzelnen Hook-Implementierungen und
 * stellt sicher, dass alle Registrierungen auch bei Fehlerpfaden
 * (z.B. teilweise erfolgreiche Registrierungen) sauber zurückgerollt werden.
 */
export class HookRegistrationManager {
  private readonly cleanupCallbacks: Array<() => void> = [];

  /**
   * Registers a cleanup callback that will be invoked when dispose() is called.
   *
   * Typical usage:
   * ```ts
   * const result = hooks.on(name, callback);
   * if (result.ok) {
   *   manager.register(() => hooks.off(name, result.value));
   * }
   * ```
   */
  register(unregister: () => void): void {
    this.cleanupCallbacks.push(unregister);
  }

  /**
   * Invokes all registered cleanup callbacks once and clears the internal list.
   * Subsequent calls are no-ops.
   */
  dispose(): void {
    while (this.cleanupCallbacks.length > 0) {
      const unregister = this.cleanupCallbacks.pop();
      try {
        unregister?.();
      } catch {
        // Defensive: Fehler beim Abmelden eines Hooks sollen den Shutdown
        // nicht abbrechen. Logging passiert in den aufrufenden Services.
      }
    }
  }
}
