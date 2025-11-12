/**
 * TraceContext service for automatic trace ID propagation.
 *
 * Provides automatic trace ID management across nested function calls,
 * eliminating the need to manually pass trace IDs through function parameters.
 *
 * @example
 * ```typescript
 * // Automatic trace propagation
 * traceContext.trace(() => {
 *   logger.info("Starting operation"); // Automatically traced!
 *   doSomething(); // Nested calls see the same trace ID
 *   logger.info("Completed"); // Same trace ID
 * });
 *
 * // Custom trace ID
 * traceContext.trace(() => {
 *   // ...
 * }, { traceId: "custom-trace-123" });
 *
 * // Nested traces
 * traceContext.trace(() => {
 *   logger.info("Outer trace");
 *   traceContext.trace(() => {
 *     logger.info("Inner trace"); // Different trace ID
 *   });
 *   logger.info("Back to outer trace");
 * });
 * ```
 */

import { generateTraceId } from "@/utils/observability/trace";
import type { Disposable } from "@/di_infrastructure/interfaces/disposable";

/**
 * Options for trace operations.
 */
export interface TraceOptions {
  /**
   * Custom trace ID to use instead of auto-generating.
   * If not provided, a new trace ID will be generated.
   */
  traceId?: string;

  /**
   * Optional operation name for logging purposes.
   */
  operationName?: string;

  /**
   * Optional metadata to attach to the trace context.
   */
  metadata?: Record<string, unknown>;
}

/**
 * Service for managing trace context across function calls.
 *
 * Provides automatic trace ID propagation through a call stack,
 * eliminating the need to manually pass trace IDs as parameters.
 *
 * Key features:
 * - Automatic trace ID generation
 * - Context stacking for nested traces
 * - Proper cleanup via try/finally
 * - Support for both sync and async operations
 *
 * Note: TraceContext has no dependencies to avoid circular dependency with Logger.
 * Logger can optionally use TraceContext.getCurrentTraceId() for automatic trace injection.
 *
 * @example
 * ```typescript
 * const traceContext = container.resolve(traceContextToken);
 *
 * // Sync operation
 * const result = traceContext.trace(() => {
 *   return performOperation();
 * });
 *
 * // Async operation
 * const result = await traceContext.traceAsync(async () => {
 *   return await fetchData();
 * });
 *
 * // Check current trace ID
 * const currentTraceId = traceContext.getCurrentTraceId();
 * ```
 */
export class TraceContext implements Disposable {
  static dependencies = [] as const;

  /**
   * Current trace ID in the context stack.
   * Null when not in a traced context.
   */
  private currentTraceId: string | null = null;

  /**
   * Executes a synchronous function with trace context.
   *
   * Automatically generates a trace ID if not provided.
   * Maintains a context stack for nested traces.
   * Ensures proper cleanup via try/finally.
   *
   * @template T - The return type of the function
   * @param fn - Function to execute with trace context
   * @param options - Trace options (trace ID, operation name, metadata)
   * @returns The result of the function execution
   *
   * @example
   * ```typescript
   * const result = traceContext.trace(() => {
   *   logger.info("Processing"); // Automatically traced
   *   return processData();
   * });
   * ```
   */
  trace<T>(fn: () => T, options?: string | TraceOptions): T {
    // Normalize options
    const opts = typeof options === "string" ? { traceId: options } : options;
    const traceId = opts?.traceId ?? generateTraceId();

    // Save previous trace ID for context restoration
    const previousTraceId = this.currentTraceId;

    // Set new trace ID
    this.currentTraceId = traceId;

    try {
      // Execute function in trace context
      return fn();
    } finally {
      // Always restore previous trace ID (even on exception)
      this.currentTraceId = previousTraceId;
    }
  }

  /**
   * Executes an asynchronous function with trace context.
   *
   * Similar to trace() but for async operations.
   * Automatically generates a trace ID if not provided.
   * Maintains a context stack for nested traces.
   * Ensures proper cleanup via try/finally.
   *
   * @template T - The return type of the async function
   * @param fn - Async function to execute with trace context
   * @param options - Trace options (trace ID, operation name, metadata)
   * @returns Promise resolving to the result of the function execution
   *
   * @example
   * ```typescript
   * const result = await traceContext.traceAsync(async () => {
   *   logger.info("Fetching data"); // Automatically traced
   *   return await fetchData();
   * });
   * ```
   */
  async traceAsync<T>(fn: () => Promise<T>, options?: string | TraceOptions): Promise<T> {
    // Normalize options
    const opts = typeof options === "string" ? { traceId: options } : options;
    const traceId = opts?.traceId ?? generateTraceId();

    // Save previous trace ID for context restoration
    const previousTraceId = this.currentTraceId;

    // Set new trace ID
    this.currentTraceId = traceId;

    try {
      // Execute async function in trace context
      return await fn();
    } finally {
      // Always restore previous trace ID (even on exception)
      this.currentTraceId = previousTraceId;
    }
  }

  /**
   * Gets the current trace ID from the context stack.
   *
   * Returns null if not currently in a traced context.
   * Useful for services that need to access the current trace ID
   * without having it passed as a parameter.
   *
   * @returns Current trace ID or null if not in traced context
   *
   * @example
   * ```typescript
   * const traceId = traceContext.getCurrentTraceId();
   * if (traceId) {
   *   console.log(`Current trace: ${traceId}`);
   * }
   * ```
   */
  getCurrentTraceId(): string | null {
    return this.currentTraceId;
  }

  /**
   * Cleans up resources.
   * For TraceContext, this resets the current trace ID.
   */
  dispose(): void {
    this.currentTraceId = null;
  }
}
