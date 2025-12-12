/**
 * Definition for a metric that can be dynamically registered.
 *
 * Follows Open/Closed Principle: New metrics can be added by creating
 * new definitions without modifying the MetricsCollector.
 *
 * @template T - The type of the metric value
 */
export interface MetricDefinition<T = unknown> {
  /**
   * Unique identifier for the metric.
   * Used as key in the metrics map.
   */
  readonly key: string;

  /**
   * Initial/default value for the metric.
   */
  readonly initialValue: T;

  /**
   * Reducer function to update the metric state.
   * Called when a metric event is recorded.
   *
   * @param current - Current metric state
   * @param event - Event data (type depends on metric)
   * @returns Updated metric state
   */
  readonly reducer: (current: T, event: unknown) => T;

  /**
   * Serializer function to convert metric state for persistence/snapshot.
   *
   * @param value - Current metric value
   * @returns Serialized representation
   */
  readonly serializer: (value: T) => unknown;
}

/**
 * State of a single metric.
 */
export interface MetricState<T = unknown> {
  /**
   * Current value of the metric.
   */
  value: T;

  /**
   * Definition that describes this metric.
   */
  definition: MetricDefinition<T>;
}
