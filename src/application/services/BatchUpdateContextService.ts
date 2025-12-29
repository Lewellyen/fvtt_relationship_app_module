/**
 * Service for tracking journal IDs during batch update operations.
 *
 * This service allows use-cases to mark multiple journal IDs as part of a batch operation,
 * which can be checked by other services (e.g., event handlers) to optimize behavior
 * (e.g., skip individual re-renders during batch updates).
 *
 * **Thread-Safety:**
 * JavaScript is single-threaded, so Set operations are inherently thread-safe.
 * However, this service should be used as a singleton to ensure consistent state
 * across all use-cases that need to check batch status.
 *
 * **Usage:**
 * ```typescript
 * // In a use-case performing batch updates:
 * batchContext.addToBatch(...journalIds);
 * // ... perform updates ...
 * batchContext.removeFromBatch(...journalIds);
 *
 * // In an event handler:
 * if (batchContext.isInBatch(journalId)) {
 *   // Skip individual processing, wait for batch completion
 *   return;
 * }
 * ```
 *
 * **Platform-Agnostic:**
 * This service is purely in-memory and platform-agnostic, making it suitable
 * for any VTT platform (Foundry, Roll20, etc.).
 */
export class BatchUpdateContextService {
  private readonly batchIds = new Set<string>();

  /**
   * Adds one or more journal IDs to the batch update context.
   *
   * @param journalIds - Journal IDs to add to the batch
   */
  addToBatch(...journalIds: string[]): void {
    for (const id of journalIds) {
      this.batchIds.add(id);
    }
  }

  /**
   * Removes one or more journal IDs from the batch update context.
   *
   * @param journalIds - Journal IDs to remove from the batch
   */
  removeFromBatch(...journalIds: string[]): void {
    for (const id of journalIds) {
      this.batchIds.delete(id);
    }
  }

  /**
   * Removes all journal IDs from the batch update context.
   *
   * Useful for cleanup in error scenarios or when batch state needs to be reset.
   */
  clearBatch(): void {
    this.batchIds.clear();
  }

  /**
   * Checks if a journal ID is currently part of a batch update.
   *
   * @param journalId - The journal ID to check
   * @returns `true` if the journal ID is in the batch, `false` otherwise
   */
  isInBatch(journalId: string): boolean {
    return this.batchIds.has(journalId);
  }

  /**
   * Checks if the batch update context is empty.
   *
   * @returns `true` if no journal IDs are in the batch, `false` otherwise
   */
  isEmpty(): boolean {
    return this.batchIds.size === 0;
  }
}

/**
 * DI-enabled wrapper for BatchUpdateContextService.
 *
 * This service must be registered as a SINGLETON to ensure that all use-cases
 * and event handlers share the same batch context state.
 */
export class DIBatchUpdateContextService extends BatchUpdateContextService {
  static dependencies = [] as const;

  constructor() {
    super();
  }
}
