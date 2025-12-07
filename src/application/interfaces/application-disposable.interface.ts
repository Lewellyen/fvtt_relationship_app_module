/**
 * Application layer disposable interface.
 *
 * This interface is used in the Application layer to avoid direct dependency
 * on Infrastructure layer's Disposable interface, maintaining Clean Architecture
 * dependency rules.
 *
 * Application layer components that need disposal should implement this interface
 * instead of importing Disposable from Infrastructure.
 */
export interface ApplicationDisposable {
  /**
   * Dispose of resources and clean up.
   * Called when the component is no longer needed.
   */
  dispose(): void;
}
