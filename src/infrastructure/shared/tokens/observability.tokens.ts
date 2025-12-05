/**
 * Observability tokens for metrics, tracing, and port selection monitoring.
 *
 * WICHTIG: ObservabilityRegistry Type-Import entfernt, um Zyklus zu vermeiden!
 * Token-Generics werden beim resolve() aufgelöst.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createInjectionToken } from "@/infrastructure/di/token-factory";
import type { MetricsCollector } from "@/infrastructure/observability/metrics-collector";
import type { MetricsRecorder } from "@/infrastructure/observability/interfaces/metrics-recorder";
import type { MetricsSampler } from "@/infrastructure/observability/interfaces/metrics-sampler";
import type { MetricsStorage } from "@/infrastructure/observability/metrics-persistence/metrics-storage";
import type { TraceContext } from "@/infrastructure/observability/trace/TraceContext";
import type { PortSelectionEventEmitter } from "@/infrastructure/adapters/foundry/versioning/port-selection-events";

/**
 * Injection token for the MetricsCollector service.
 *
 * Provides observability and performance tracking for the DI container.
 * Collects metrics about service resolutions, port selections, and cache performance.
 *
 * @example
 * ```typescript
 * const metrics = container.resolve(metricsCollectorToken);
 * metrics.recordResolution(someToken, 2.5, true);
 * const snapshot = metrics.getSnapshot();
 * console.table(snapshot);
 * ```
 */
export const metricsCollectorToken = createInjectionToken<MetricsCollector>("MetricsCollector");

/**
 * Injection token for the MetricsRecorder interface.
 *
 * Provides minimal recording capability without full MetricsCollector features.
 * Use this token when you only need to record metrics, not query or sample them.
 *
 * **Design:** Implements Interface Segregation Principle - depend on minimal interface.
 *
 * @example
 * ```typescript
 * class MyService {
 *   static dependencies = [metricsRecorderToken] as const;
 *   constructor(private recorder: MetricsRecorder) {}
 *   // Can record but not query metrics
 * }
 * ```
 */
export const metricsRecorderToken = createInjectionToken<MetricsRecorder>("MetricsRecorder");

/**
 * Injection token for the MetricsSampler interface.
 *
 * Provides sampling decision capability without full MetricsCollector features.
 * Use this token when you only need to check if sampling should occur.
 *
 * **Design:** Implements Interface Segregation Principle - depend on minimal interface.
 *
 * @example
 * ```typescript
 * class PerformanceTracker {
 *   static dependencies = [metricsSamplerToken] as const;
 *   constructor(private sampler: MetricsSampler) {}
 *   // Can check sampling but not record or query
 * }
 * ```
 */
export const metricsSamplerToken = createInjectionToken<MetricsSampler>("MetricsSampler");

/**
 * Injection token for metrics persistence storage.
 */
export const metricsStorageToken = createInjectionToken<MetricsStorage>("MetricsStorage");

/**
 * Injection token for the TraceContext service.
 *
 * Provides automatic trace ID propagation across nested function calls.
 * Eliminates the need to manually pass trace IDs through function parameters.
 *
 * **Key Features:**
 * - Automatic trace ID generation
 * - Context stacking for nested traces
 * - Support for both sync and async operations
 * - Integration with Logger for automatic trace ID injection
 *
 * @example
 * ```typescript
 * const traceContext = container.resolve(traceContextToken);
 *
 * // Automatic trace propagation
 * traceContext.trace(() => {
 *   logger.info("Starting operation"); // Automatically traced
 *   doSomething(); // Nested calls see the same trace ID
 * });
 *
 * // Async operation
 * await traceContext.traceAsync(async () => {
 *   const result = await fetchData();
 *   return result;
 * });
 * ```
 */
export const traceContextToken = createInjectionToken<TraceContext>("TraceContext");

/**
 * Injection token for the PortSelectionEventEmitter.
 *
 * Provides event emission infrastructure for PortSelector observability.
 * Registered as TRANSIENT - each service gets its own instance.
 *
 * @example
 * ```typescript
 * class PortSelector {
 *   constructor(emitter: PortSelectionEventEmitter) {
 *     this.emitter = emitter;
 *   }
 * }
 * ```
 */
export const portSelectionEventEmitterToken = createInjectionToken<PortSelectionEventEmitter>(
  "PortSelectionEventEmitter"
);

/**
 * Injection token for the ObservabilityRegistry.
 *
 * Central registry for self-registering observable services.
 * Services register themselves at construction time for automatic observability.
 *
 * Generic Type wird beim resolve() aufgelöst - kein Import nötig!
 * Dies verhindert Zyklus: observability.tokens ↔ observability-registry
 *
 * @example
 * ```typescript
 * class PortSelector {
 *   constructor(observability: ObservabilityRegistry) {
 *     observability.registerPortSelector(this);
 *   }
 * }
 * ```
 */
export const observabilityRegistryToken = createInjectionToken<any>("ObservabilityRegistry");
