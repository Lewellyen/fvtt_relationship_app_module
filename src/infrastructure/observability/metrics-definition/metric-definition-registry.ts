import type { MetricDefinition } from "./metric-definition.interface";
import { castToMetricDefinition } from "./metric-casts";

/**
 * Registry for metric definitions.
 *
 * Manages all available metric definitions and prevents key collisions.
 * Follows Open/Closed Principle: New metrics can be registered without
 * modifying the MetricsCollector.
 */
export class MetricDefinitionRegistry {
  private readonly definitions = new Map<string, MetricDefinition>();

  /**
   * Registers a metric definition.
   *
   * @param definition - Metric definition to register
   * @throws Error if a definition with the same key already exists or if the definition is invalid
   */
  register<T = unknown>(definition: MetricDefinition<T>): void {
    if (this.definitions.has(definition.key)) {
      throw new Error(
        `Metric definition with key "${definition.key}" already exists. Use a different key or remove the existing definition first.`
      );
    }
    // Runtime-safe cast: validates structure before storing
    this.definitions.set(definition.key, castToMetricDefinition(definition));
  }

  /**
   * Gets a metric definition by key.
   *
   * @param key - Metric key
   * @returns Metric definition or undefined if not found
   */
  get(key: string): MetricDefinition | undefined {
    return this.definitions.get(key);
  }

  /**
   * Gets all registered metric definitions.
   *
   * @returns Array of all metric definitions
   */
  getAll(): readonly MetricDefinition[] {
    return Array.from(this.definitions.values());
  }

  /**
   * Checks if a metric definition exists.
   *
   * @param key - Metric key
   * @returns True if definition exists
   */
  has(key: string): boolean {
    return this.definitions.has(key);
  }

  /**
   * Removes a metric definition.
   *
   * @param key - Metric key to remove
   * @returns True if definition was removed, false if it didn't exist
   */
  remove(key: string): boolean {
    return this.definitions.delete(key);
  }

  /**
   * Clears all registered definitions.
   */
  clear(): void {
    this.definitions.clear();
  }

  /**
   * Gets the number of registered definitions.
   *
   * @returns Number of registered definitions
   */
  size(): number {
    return this.definitions.size;
  }
}
