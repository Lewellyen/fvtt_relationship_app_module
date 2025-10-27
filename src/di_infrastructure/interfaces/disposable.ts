/**
 * Interface for services that need cleanup when their scope is disposed.
 * Services implementing this interface will automatically have their dispose() method called
 * when the container's dispose() method is invoked.
 *
 * @interface Disposable
 *
 * @example
 * ```typescript
 * class DatabaseConnection implements Disposable {
 *   private connection: any;
 *
 *   async connect() {
 *     this.connection = await openConnection();
 *   }
 *
 *   dispose() {
 *     this.connection.close(); // Cleanup aufräumen
 *   }
 * }
 * ```
 */
export interface Disposable {
  /**
   * Perform cleanup operations.
   * This method is automatically called when the container is disposed.
   */
  dispose(): void;
}
