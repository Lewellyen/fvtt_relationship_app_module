/**
 * Injection token for the MetricsRecorder interface.
 *
 * Uses type-only import to prevent circular dependencies while maintaining type safety.
 * TypeScript removes type imports at compile time, so they don't create runtime dependencies.
 */
import { createInjectionToken } from "@/infrastructure/di/token-factory";
import type { MetricsRecorder } from "@/infrastructure/observability/interfaces/metrics-recorder";

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
