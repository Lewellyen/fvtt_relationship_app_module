import { METRICS_CONFIG } from "@/infrastructure/shared/constants";
import type { MetricDefinition } from "./metric-definition.interface";
import type { InjectionToken } from "@/infrastructure/di/types/core/injectiontoken";

/**
 * Default metric definitions for the MetricsCollector.
 *
 * These definitions represent the built-in metrics that are always available.
 * New metrics can be added by creating additional definitions and registering them.
 */

/**
 * Resolution event data structure.
 */
interface ResolutionEvent {
  token: InjectionToken<unknown>;
  durationMs: number;
  success: boolean;
}

/**
 * Port selection event data structure.
 */
interface PortSelectionEvent {
  version: number;
}

/**
 * Cache access event data structure.
 */
interface CacheAccessEvent {
  hit: boolean;
}

/**
 * Type guard for ResolutionEvent.
 */
function isResolutionEvent(event: unknown): event is ResolutionEvent {
  return (
    typeof event === "object" &&
    event !== null &&
    "durationMs" in event &&
    typeof (event as { durationMs: unknown }).durationMs === "number" &&
    "success" in event &&
    typeof (event as { success: unknown }).success === "boolean"
  );
}

/**
 * Type guard for PortSelectionEvent.
 */
function isPortSelectionEvent(event: unknown): event is PortSelectionEvent {
  return (
    typeof event === "object" &&
    event !== null &&
    "version" in event &&
    typeof (event as { version: unknown }).version === "number"
  );
}

/**
 * Type guard for CacheAccessEvent.
 */
function isCacheAccessEvent(event: unknown): event is CacheAccessEvent {
  return (
    typeof event === "object" &&
    event !== null &&
    "hit" in event &&
    typeof (event as { hit: unknown }).hit === "boolean"
  );
}

/**
 * Resolution times state structure.
 */
interface ResolutionTimesState {
  buffer: Float64Array;
  index: number;
  count: number;
}

/**
 * Container resolutions metric definition.
 */
export const containerResolutionsDefinition: MetricDefinition<number> = {
  key: "containerResolutions",
  initialValue: 0,
  reducer: (current: number, _event: unknown) => current + 1,
  serializer: (value: number) => value,
};

/**
 * Resolution errors metric definition.
 */
export const resolutionErrorsDefinition: MetricDefinition<number> = {
  key: "resolutionErrors",
  initialValue: 0,
  reducer: (current: number, event: unknown) => {
    if (!isResolutionEvent(event)) {
      return current;
    }
    return event.success ? current : current + 1;
  },
  serializer: (value: number) => value,
};

/**
 * Cache hits metric definition.
 */
export const cacheHitsDefinition: MetricDefinition<number> = {
  key: "cacheHits",
  initialValue: 0,
  reducer: (current: number, event: unknown) => {
    if (!isCacheAccessEvent(event)) {
      return current;
    }
    return event.hit ? current + 1 : current;
  },
  serializer: (value: number) => value,
};

/**
 * Cache misses metric definition.
 */
export const cacheMissesDefinition: MetricDefinition<number> = {
  key: "cacheMisses",
  initialValue: 0,
  reducer: (current: number, event: unknown) => {
    if (!isCacheAccessEvent(event)) {
      return current;
    }
    return event.hit ? current : current + 1;
  },
  serializer: (value: number) => value,
};

/**
 * Port selections metric definition.
 */
export const portSelectionsDefinition: MetricDefinition<Map<number, number>> = {
  key: "portSelections",
  initialValue: new Map<number, number>(),
  reducer: (current: Map<number, number>, event: unknown) => {
    if (!isPortSelectionEvent(event)) {
      return current;
    }
    const count = current.get(event.version) ?? 0;
    const updated = new Map(current);
    updated.set(event.version, count + 1);
    return updated;
  },
  serializer: (value: Map<number, number>) => Object.fromEntries(value),
};

/**
 * Port selection failures metric definition.
 */
export const portSelectionFailuresDefinition: MetricDefinition<Map<number, number>> = {
  key: "portSelectionFailures",
  initialValue: new Map<number, number>(),
  reducer: (current: Map<number, number>, event: unknown) => {
    if (!isPortSelectionEvent(event)) {
      return current;
    }
    const count = current.get(event.version) ?? 0;
    const updated = new Map(current);
    updated.set(event.version, count + 1);
    return updated;
  },
  serializer: (value: Map<number, number>) => Object.fromEntries(value),
};

/**
 * Resolution times metric definition.
 * Uses a circular buffer for efficient storage.
 */
export const resolutionTimesDefinition: MetricDefinition<ResolutionTimesState> = {
  key: "resolutionTimes",
  initialValue: {
    buffer: new Float64Array(METRICS_CONFIG.RESOLUTION_TIMES_BUFFER_SIZE),
    index: 0,
    count: 0,
  },
  reducer: (current: ResolutionTimesState, event: unknown) => {
    if (!isResolutionEvent(event)) {
      return current;
    }
    const buffer = new Float64Array(current.buffer);
    const maxSize = METRICS_CONFIG.RESOLUTION_TIMES_BUFFER_SIZE;

    // Set value at current index position (circular buffer)
    buffer[current.index] = event.durationMs;

    // Update index for next write (circular)
    const newIndex = (current.index + 1) % maxSize;
    const newCount = Math.min(current.count + 1, maxSize);

    return {
      buffer,
      index: newIndex,
      count: newCount,
    };
  },
  serializer: (value: ResolutionTimesState) => ({
    buffer: Array.from(value.buffer),
    index: value.index,
    count: value.count,
  }),
};

import { MetricDefinitionRegistry } from "./metric-definition-registry";

/**
 * Creates a default metric definition registry with all built-in metrics.
 *
 * @returns Registry with all default metric definitions registered
 */
export function createDefaultMetricDefinitionRegistry(): MetricDefinitionRegistry {
  const registry = new MetricDefinitionRegistry();

  registry.register(containerResolutionsDefinition);
  registry.register(resolutionErrorsDefinition);
  registry.register(cacheHitsDefinition);
  registry.register(cacheMissesDefinition);
  registry.register(portSelectionsDefinition);
  registry.register(portSelectionFailuresDefinition);
  registry.register(resolutionTimesDefinition);

  return registry;
}
