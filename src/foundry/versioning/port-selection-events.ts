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

import type { FoundryError } from "@/foundry/errors/FoundryErrors";

export type PortSelectionSuccessEvent = {
  type: "success";
  selectedVersion: number;
  foundryVersion: number;
  durationMs: number;
  adapterName?: string;
};

export type PortSelectionFailureEvent = {
  type: "failure";
  foundryVersion: number;
  availableVersions: string;
  adapterName?: string;
  error: FoundryError;
};

export type PortSelectionEvent = PortSelectionSuccessEvent | PortSelectionFailureEvent;
export type PortSelectionEventCallback = (event: PortSelectionEvent) => void;

/**
 * Simple observable emitter used by the PortSelector to notify interested
 * observers about success/failure outcomes.
 */
export class PortSelectionEventEmitter {
  private readonly subscribers = new Set<PortSelectionEventCallback>();

  subscribe(callback: PortSelectionEventCallback): () => void {
    this.subscribers.add(callback);
    let active = true;

    return () => {
      if (!active) {
        return;
      }
      active = false;
      this.subscribers.delete(callback);
    };
  }

  emit(event: PortSelectionEvent): void {
    for (const callback of this.subscribers) {
      try {
        callback(event);
      } catch (error) {
        console.error("PortSelectionEventEmitter subscriber error", error);
      }
    }
  }

  clear(): void {
    this.subscribers.clear();
  }

  getSubscriberCount(): number {
    return this.subscribers.size;
  }
}

export class DIPortSelectionEventEmitter extends PortSelectionEventEmitter {
  static dependencies = [] as const;
}
