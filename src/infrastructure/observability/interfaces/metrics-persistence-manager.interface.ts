import type { IRawMetrics } from "./raw-metrics.interface";
import type { MetricsPersistenceState } from "../metrics-types";

/**
 * Interface for managing metrics persistence.
 */
export interface IMetricsPersistenceManager {
  /**
   * Serializes raw metrics into a persistence state.
   *
   * @param metrics - Raw metrics data
   * @returns Serializable persistence state
   */
  serialize(metrics: IRawMetrics): MetricsPersistenceState;

  /**
   * Deserializes a persistence state into raw metrics.
   *
   * @param state - Persisted state (can be null or undefined)
   * @returns Raw metrics data
   */
  deserialize(state: MetricsPersistenceState | null | undefined): IRawMetrics;
}
