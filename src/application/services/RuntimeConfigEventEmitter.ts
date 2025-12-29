import type { RuntimeConfigKey, RuntimeConfigValues } from "@/domain/types/runtime-config";

type RuntimeConfigListener<K extends RuntimeConfigKey> = (value: RuntimeConfigValues[K]) => void;

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
    const existing = this.getListenersForKey<K>(key);
    const listeners: Set<RuntimeConfigListener<K>> =
      existing ?? new Set<RuntimeConfigListener<K>>();
    listeners.add(listener);

    this.setListenersForKey(key, listeners);

    return () => {
      const activeListeners = this.getListenersForKey<K>(key);
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
    const listeners = this.listeners.get(key) as Set<RuntimeConfigListener<K>> | undefined;
    if (!listeners || listeners.size === 0) {
      return;
    }

    for (const listener of listeners) {
      listener(value);
    }
  }

  /**
   * Type-safe helper to get listeners for a specific key.
   * @ts-expect-error - Type coverage exclusion for generic Set cast
   */
  private getListenersForKey<K extends RuntimeConfigKey>(
    key: K
  ): Set<RuntimeConfigListener<K>> | undefined {
    return this.listeners.get(key) as Set<RuntimeConfigListener<K>> | undefined;
  }

  /**
   * Type-safe helper to set listeners for a specific key.
   * @ts-expect-error - Type coverage exclusion for generic Set cast
   */
  private setListenersForKey<K extends RuntimeConfigKey>(
    key: K,
    listeners: Set<RuntimeConfigListener<K>>
  ): void {
    // type-coverage:ignore-next-line - Generic Set cast required for type-safe listener management
    this.listeners.set(key, listeners as Set<RuntimeConfigListener<RuntimeConfigKey>>);
  }
}
