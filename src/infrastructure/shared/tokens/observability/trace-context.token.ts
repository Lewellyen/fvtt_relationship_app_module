/**
 * Injection token for the TraceContext service.
 *
 * Uses type-only import to prevent circular dependencies while maintaining type safety.
 * TypeScript removes type imports at compile time, so they don't create runtime dependencies.
 */
import { createInjectionToken } from "@/infrastructure/di/token-factory";
import type { TraceContext } from "@/infrastructure/observability/trace/TraceContext";

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
