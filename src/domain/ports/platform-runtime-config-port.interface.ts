import type { RuntimeConfigKey, RuntimeConfigValues } from "@/domain/types/runtime-config";

/**
 * Platform-agnostic port for runtime configuration management.
 * Provides access to merged configuration (build-time defaults + runtime settings).
 */
export interface PlatformRuntimeConfigPort {
  /**
   * Returns the current value for the given configuration key.
   */
  get<K extends RuntimeConfigKey>(key: K): RuntimeConfigValues[K];

  /**
   * Updates the configuration value based on platform settings.
   */
  setFromPlatform<K extends RuntimeConfigKey>(key: K, value: RuntimeConfigValues[K]): void;

  /**
   * Registers a listener for the given key. Returns an unsubscribe function.
   */
  onChange<K extends RuntimeConfigKey>(
    key: K,
    listener: (value: RuntimeConfigValues[K]) => void
  ): () => void;
}
