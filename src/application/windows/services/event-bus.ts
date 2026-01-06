import type { IEventBus } from "@/domain/windows/ports/event-bus-port.interface";
import type { WindowEventMap } from "@/domain/windows/types/event-map.interface";
import { getMapValueOrCreate, castEventHandlerForSet } from "../utils/window-state-casts";

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
    const eventListeners = getMapValueOrCreate(
      this.listeners,
      event,
      () => new Set<(payload: unknown) => void>()
    );
    const castHandler = castEventHandlerForSet(handler);
    eventListeners.add(castHandler);

    // Return unsubscribe function
    return () => {
      eventListeners.delete(castHandler);
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

    const castHandler = castEventHandlerForSet(handler);
    eventListeners.delete(castHandler);
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
