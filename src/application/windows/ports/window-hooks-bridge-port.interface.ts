/**
 * Port interface for WindowHooksBridge.
 *
 * Provides a Clean Architecture boundary between Application Layer and Infrastructure Layer.
 * The Application Layer should not depend on concrete Infrastructure implementations.
 *
 * @see WindowHooksBridge (infrastructure implementation)
 */
export interface IWindowHooksBridge {
  /**
   * Registers Foundry hooks for window-related events.
   * Should be called after successful bootstrap.
   */
  register(): void;

  /**
   * Unregisters Foundry hooks.
   * Should be called during shutdown.
   */
  unregister(): void;
}
