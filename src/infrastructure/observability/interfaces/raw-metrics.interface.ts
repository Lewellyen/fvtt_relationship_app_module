/**
 * Raw metrics data structure.
 * Represents the internal state of metrics collection without aggregation.
 */
export interface IRawMetrics {
  containerResolutions: number;
  resolutionErrors: number;
  cacheHits: number;
  cacheMisses: number;
  portSelections: Map<number, number>;
  portSelectionFailures: Map<number, number>;
  resolutionTimes: Float64Array;
  resolutionTimesIndex: number;
  resolutionTimesCount: number;
}
