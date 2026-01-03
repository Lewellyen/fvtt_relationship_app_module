import type { WindowEventMap } from "../types/event-map.interface";

/**
 * IEventBus - Typisiertes Event-System für Window-Framework
 */
export interface IEventBus {
  /**
   * Emittiert ein typisiertes Event.
   *
   * @param event - Event-Name (keyof EventMap)
   * @param payload - Event-Payload (typisiert)
   * @returns void
   */
  emit<K extends keyof WindowEventMap>(event: K, payload: WindowEventMap[K]): void;

  /**
   * Registriert einen typisierten Event-Listener.
   *
   * @param event - Event-Name (keyof EventMap)
   * @param handler - Event-Handler (typisiert)
   * @returns Unsubscribe-Funktion
   */
  on<K extends keyof WindowEventMap>(
    event: K,
    handler: (payload: WindowEventMap[K]) => void
  ): () => void;

  /**
   * Entfernt einen Event-Listener.
   *
   * @param event - Event-Name
   * @param handler - Event-Handler
   * @returns void
   */
  off<K extends keyof WindowEventMap>(
    event: K,
    handler: (payload: WindowEventMap[K]) => void
  ): void;

  /**
   * Registriert einen einmaligen Event-Listener.
   *
   * @param event - Event-Name
   * @param handler - Event-Handler
   * @returns void
   */
  once<K extends keyof WindowEventMap>(
    event: K,
    handler: (payload: WindowEventMap[K]) => void
  ): void;
}
