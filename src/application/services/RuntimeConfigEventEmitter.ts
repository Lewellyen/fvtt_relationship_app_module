import type { RuntimeConfigKey, RuntimeConfigValues } from "@/domain/types/runtime-config";

/**
 * Bivariance helper for callback parameter types.
 *
 * This avoids unsafe type assertions when storing key-specific listeners in a shared collection.
 * It mirrors the common "bivarianceHack" pattern used in libraries like React typings.
 */
type BivariantCallback<T> = { bivarianceHack(value: T): void }["bivarianceHack"];

type RuntimeConfigListener<K extends RuntimeConfigKey> = BivariantCallback<RuntimeConfigValues[K]>;

/**
 * Interface for runtime configuration event emission.
 * Allows for dependency injection and testing.
 */
export interface IRuntimeConfigEventEmitter {
  onChange<K extends RuntimeConfigKey>(key: K, listener: RuntimeConfigListener<K>): () => void;
  notify<K extends RuntimeConfigKey>(key: K, value: RuntimeConfigValues[K]): void;
}

/**
 * RuntimeConfigEventEmitter
 *
 * Manages event listeners for runtime configuration changes.
 * Single Responsibility: Listener management only.
 */
export class RuntimeConfigEventEmitter implements IRuntimeConfigEventEmitter {
  private readonly listeners = new Map<
    RuntimeConfigKey,
    Set<RuntimeConfigListener<RuntimeConfigKey>>
  >();

  /**
   * Registers a listener for the given key. Returns an unsubscribe function.
   */
  onChange<K extends RuntimeConfigKey>(key: K, listener: RuntimeConfigListener<K>): () => void {
    const existing = this.listeners.get(key);
    const listeners: Set<RuntimeConfigListener<RuntimeConfigKey>> =
      existing ?? new Set<RuntimeConfigListener<RuntimeConfigKey>>();
    listeners.add(listener);
    this.listeners.set(key, listeners);

    return () => {
      const activeListeners = this.listeners.get(key);
      activeListeners?.delete(listener);
      if (!activeListeners || activeListeners.size === 0) {
        this.listeners.delete(key);
      }
    };
  }

  /**
   * Notifies all listeners for the given key with the new value.
   */
  notify<K extends RuntimeConfigKey>(key: K, value: RuntimeConfigValues[K]): void {
    const listeners = this.listeners.get(key);
    if (!listeners || listeners.size === 0) {
      return;
    }

    for (const listener of listeners) {
      listener(value);
    }
  }
}
