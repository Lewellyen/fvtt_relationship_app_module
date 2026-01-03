import type { IEventBus } from "@/domain/windows/ports/event-bus-port.interface";
import type { WindowEventMap } from "@/domain/windows/types/event-map.interface";

/**
 * EventBus - Typisiertes Event-System für Window-Framework
 *
 * Implementiert IEventBus mit typisiertem Event-System basierend auf WindowEventMap.
 */
export class EventBus implements IEventBus {
  private readonly listeners = new Map<keyof WindowEventMap, Set<(payload: unknown) => void>>();

  emit<K extends keyof WindowEventMap>(event: K, payload: WindowEventMap[K]): void {
    const eventListeners = this.listeners.get(event);
    if (!eventListeners) return;

    for (const listener of eventListeners) {
      listener(payload);
    }
  }

  on<K extends keyof WindowEventMap>(
    event: K,
    handler: (payload: WindowEventMap[K]) => void
  ): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    // type-coverage:ignore-next-line
    const eventListeners = this.listeners.get(event)!;
    // type-coverage:ignore-next-line
    eventListeners.add(handler as (payload: unknown) => void);

    // Return unsubscribe function
    return () => {
      // type-coverage:ignore-next-line
      eventListeners.delete(handler as (payload: unknown) => void);
      if (eventListeners.size === 0) {
        this.listeners.delete(event);
      }
    };
  }

  off<K extends keyof WindowEventMap>(
    event: K,
    handler: (payload: WindowEventMap[K]) => void
  ): void {
    const eventListeners = this.listeners.get(event);
    if (!eventListeners) return;

    // type-coverage:ignore-next-line
    eventListeners.delete(handler as (payload: unknown) => void);
    if (eventListeners.size === 0) {
      this.listeners.delete(event);
    }
  }

  once<K extends keyof WindowEventMap>(
    event: K,
    handler: (payload: WindowEventMap[K]) => void
  ): void {
    const onceHandler = (payload: WindowEventMap[K]): void => {
      handler(payload);
      this.off(event, onceHandler);
    };
    this.on(event, onceHandler);
  }
}
