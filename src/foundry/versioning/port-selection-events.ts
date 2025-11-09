/**
 * Event system for PortSelector observability.
 *
 * **Design Rationale:**
 * - Decouples PortSelector from logging and metrics concerns
 * - Follows Observer Pattern for extensible observability
 * - Reduces PortSelector dependencies from 3 to 0
 * - Allows multiple observers without modifying PortSelector
 *
 * @see PortSelector for event emission
 * @see PortSelectionObserver for event consumption
 */

/**
 * Event emitted when port selection completes successfully.
 */
export interface PortSelectionSuccessEvent {
  type: "success";
  selectedVersion: number;
  foundryVersion: number;
  adapterName: string | undefined;
  durationMs: number;
}

import type { FoundryError } from "@/foundry/errors/FoundryErrors";

/**
 * Event emitted when port selection fails.
 */
export interface PortSelectionFailureEvent {
  type: "failure";
  foundryVersion: number;
  availableVersions: string;
  adapterName: string | undefined;
  error: FoundryError;
}

/**
 * Union type of all port selection events.
 */
export type PortSelectionEvent = PortSelectionSuccessEvent | PortSelectionFailureEvent;

/**
 * Callback function for port selection events.
 */
export type PortSelectionEventCallback = (event: PortSelectionEvent) => void;

/**
 * Simple event emitter for port selection events.
 *
 * **Design:**
 * - Lightweight, no external dependencies
 * - Synchronous event dispatch
 * - Multiple subscribers supported
 *
 * @example
 * ```typescript
 * const emitter = new PortSelectionEventEmitter();
 * emitter.subscribe((event) => {
 *   if (event.type === 'success') {
 *     console.log(`Port v${event.selectedVersion} selected`);
 *   }
 * });
 * emitter.emit({ type: 'success', selectedVersion: 13, foundryVersion: 13, durationMs: 5 });
 * ```
 */
export class PortSelectionEventEmitter {
  private subscribers: PortSelectionEventCallback[] = [];

  /**
   * Subscribe to port selection events.
   *
   * @param callback - Function to call when events are emitted
   * @returns Unsubscribe function
   */
  subscribe(callback: PortSelectionEventCallback): () => void {
    this.subscribers.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index !== -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  /**
   * Emit a port selection event to all subscribers.
   *
   * Events are dispatched synchronously.
   *
   * @param event - The event to emit
   */
  emit(event: PortSelectionEvent): void {
    for (const subscriber of this.subscribers) {
      try {
        subscriber(event);
      } catch (error) {
        // Prevent one subscriber's error from affecting others
        // Log to console since we don't have logger access here
        console.error("PortSelectionEventEmitter: Subscriber error", error);
      }
    }
  }

  /**
   * Remove all subscribers.
   * Useful for cleanup in tests.
   */
  clear(): void {
    this.subscribers = [];
  }

  /**
   * Get current subscriber count.
   * Useful for testing and diagnostics.
   */
  getSubscriberCount(): number {
    return this.subscribers.length;
  }
}
