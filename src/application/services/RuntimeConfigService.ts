import type { EnvironmentConfig } from "@/domain/types/environment-config";
import type { RuntimeConfigKey, RuntimeConfigValues } from "@/domain/types/runtime-config";
import { RuntimeConfigStore } from "./RuntimeConfigStore";
import { RuntimeConfigEventEmitter } from "./RuntimeConfigEventEmitter";

type RuntimeConfigListener<K extends RuntimeConfigKey> = (value: RuntimeConfigValues[K]) => void;

/**
 * RuntimeConfigService
 *
 * Acts as a bridge between build-time environment defaults (VITE_*) and
 * runtime Foundry settings. Provides a central registry that services can
 * query for current values and subscribe to for live updates.
 *
 * Orchestrates RuntimeConfigStore (value management) and RuntimeConfigEventEmitter (listener management)
 * to follow the Single Responsibility Principle.
 */
export class RuntimeConfigService {
  private readonly store: RuntimeConfigStore;
  private readonly emitter: RuntimeConfigEventEmitter;

  constructor(env: EnvironmentConfig) {
    this.store = new RuntimeConfigStore(env);
    this.emitter = new RuntimeConfigEventEmitter();
  }

  /**
   * Returns the current value for the given configuration key.
   */
  get<K extends RuntimeConfigKey>(key: K): RuntimeConfigValues[K] {
    return this.store.get(key);
  }

  /**
   * Updates the configuration value based on Foundry settings and notifies listeners
   * only if the value actually changed.
   */
  setFromFoundry<K extends RuntimeConfigKey>(key: K, value: RuntimeConfigValues[K]): void {
    const changed = this.store.set(key, value);
    if (changed) {
      this.emitter.notify(key, value);
    }
  }

  /**
   * Registers a listener for the given key. Returns an unsubscribe function.
   */
  onChange<K extends RuntimeConfigKey>(key: K, listener: RuntimeConfigListener<K>): () => void {
    return this.emitter.onChange(key, listener);
  }
}
