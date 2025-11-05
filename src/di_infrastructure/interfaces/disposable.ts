/**
 * Interface for services that need synchronous cleanup when their scope is disposed.
 * Services implementing this interface will automatically have their dispose() method called
 * when the container's dispose() or disposeAsync() method is invoked.
 *
 * Follows TC39 Explicit Resource Management standard.
 *
 * @interface Disposable
 *
 * @example
 * ```typescript
 * class EventListenerService implements Disposable {
 *   private listeners: Map<string, Function> = new Map();
 *
 *   dispose(): void {
 *     // Synchronous cleanup
 *     this.listeners.clear();
 *     removeAllEventListeners();
 *   }
 * }
 * ```
 *
 * @see AsyncDisposable for asynchronous cleanup
 * @see https://github.com/tc39/proposal-explicit-resource-management
 */
export interface Disposable {
  /**
   * Perform synchronous cleanup operations.
   * This method is automatically called when the container is disposed.
   */
  dispose(): void;
}

/**
 * Interface for services that need asynchronous cleanup when their scope is disposed.
 * Services implementing this interface will automatically have their disposeAsync() method called
 * when the container's disposeAsync() method is invoked.
 *
 * Use this interface for resources that require async operations during cleanup,
 * such as database connections, file handles, or network sockets.
 *
 * Follows TC39 Explicit Resource Management standard.
 *
 * @interface AsyncDisposable
 *
 * @example
 * ```typescript
 * class DatabaseConnection implements AsyncDisposable {
 *   private connection: DbConnection;
 *
 *   async disposeAsync(): Promise<void> {
 *     // Asynchronous cleanup
 *     await this.connection.close();
 *     await this.flushBuffers();
 *   }
 * }
 * ```
 *
 * @see Disposable for synchronous cleanup
 * @see https://github.com/tc39/proposal-explicit-resource-management
 */
export interface AsyncDisposable {
  /**
   * Perform asynchronous cleanup operations.
   * This method must be awaited to ensure cleanup completes before proceeding.
   */
  disposeAsync(): Promise<void>;
}
