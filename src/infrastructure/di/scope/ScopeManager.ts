import type { Result } from "@/domain/types/result";
import type { ContainerError } from "../interfaces";
import type { ServiceType } from "@/infrastructure/shared/tokens";
import type { Disposable, AsyncDisposable } from "../interfaces";
import { InstanceCache } from "../cache/InstanceCache";
import { ok, err, tryCatch, isErr } from "@/infrastructure/shared/utils/result";

/**
 * Helper function to generate unique scope names.
 * Tries crypto.randomUUID(), falls back to timestamp + random.
 */
function generateScopeId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return Date.now() + "-" + Math.random();
  }
}

/**
 * Manages scope hierarchy and disposal lifecycle.
 *
 * Responsibilities:
 * - Track child scopes in hierarchy
 * - Generate scope names
 * - Dispose instances (supports both Disposable and AsyncDisposable patterns)
 * - Cascade disposal to children
 * - Enforce maximum scope depth (stack overflow protection)
 *
 * Design:
 * - NO dependency on ServiceResolver (avoids circular dependency)
 * - createChild() returns data for facade to build new container
 * - Disposal order: children first, then instances (critical!)
 * - Supports both sync (dispose()) and async (disposeAsync()) disposal modes
 *
 * Disposal Modes:
 * - dispose(): Synchronous disposal (for browser unload, emergency cleanup)
 * - disposeAsync(): Asynchronous disposal (preferred, handles async cleanup properly)
 */
export class ScopeManager {
  private readonly MAX_SCOPE_DEPTH = 10; // Prevent deep nesting and potential stack overflow
  private children = new Set<ScopeManager>();
  private disposed = false;
  private readonly depth: number;
  private readonly scopeId: string; // Unique correlation ID for tracing

  constructor(
    private readonly scopeName: string,
    private readonly parent: ScopeManager | null,
    private readonly cache: InstanceCache,
    depth: number = 0
  ) {
    this.depth = depth;
    // Generate unique correlation ID for this scope (useful for logging/tracing)
    this.scopeId = `${scopeName}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }

  /**
   * Creates a child scope manager.
   *
   * Note: Returns data (scopeName, cache, childManager) instead of full container
   * to avoid circular dependency with ServiceResolver.
   *
   * @param name - Optional custom name for the scope
   * @returns Result with child scope data or error if disposed or max depth exceeded
   */
  createChild(
    name?: string
  ): Result<{ scopeName: string; cache: InstanceCache; manager: ScopeManager }, ContainerError> {
    if (this.disposed) {
      return err({
        code: "Disposed",
        message: `Cannot create child scope from disposed scope: ${this.scopeName}`,
      });
    }

    // Check maximum scope depth (stack overflow protection)
    if (this.depth >= this.MAX_SCOPE_DEPTH) {
      return err({
        code: "MaxScopeDepthExceeded",
        message: `Maximum scope depth of ${this.MAX_SCOPE_DEPTH} exceeded. Current depth: ${this.depth}`,
      });
    }

    // Build hierarchical scope name
    const uniqueId = name ?? `scope-${generateScopeId()}`;
    const childScopeName = `${this.scopeName}.${uniqueId}`;

    // Create new cache for child
    const childCache = new InstanceCache();

    // Create child manager with incremented depth
    const childManager = new ScopeManager(childScopeName, this, childCache, this.depth + 1);

    // Only add to children set AFTER successful creation
    this.children.add(childManager);

    return ok({
      scopeName: childScopeName,
      cache: childCache,
      manager: childManager,
    });
  }

  /**
   * Disposes this scope and all child scopes.
   *
   * Disposal order (critical):
   * 1. Recursively dispose all children
   * 2. Dispose instances in this scope (if Disposable)
   * 3. Clear instance cache
   * 4. Remove from parent's children set
   *
   * @returns Result indicating success or disposal error
   */
  dispose(): Result<void, ContainerError> {
    if (this.disposed) {
      return err({
        code: "Disposed",
        message: `Scope already disposed: ${this.scopeName}`,
      });
    }

    // Mark as disposed BEFORE disposing children to prevent concurrent operations
    this.disposed = true;

    // Collect disposal errors instead of logging
    const childDisposalErrors: Array<{ scopeName: string; error: ContainerError }> = [];

    // Step 1: Recursively dispose all child scopes (children first!)
    for (const child of this.children) {
      const childResult = child.dispose();

      if (isErr(childResult)) {
        // Collect error instead of logging
        childDisposalErrors.push({
          scopeName: child.scopeName,
          error: childResult.error,
        });
      }
    }

    // Step 2: Dispose instances in this scope
    const disposeResult = this.disposeInstances();
    if (!disposeResult.ok) {
      return disposeResult;
    }

    // Step 3: Clear cache
    this.cache.clear();

    // Step 4: Remove from parent's children set
    if (this.parent !== null) {
      this.parent.children.delete(this);
    }

    // Return aggregated errors if any children failed
    if (childDisposalErrors.length > 0) {
      return err({
        code: "PartialDisposal",
        message: `Failed to dispose ${childDisposalErrors.length} child scope(s)`,
        details: childDisposalErrors,
      });
    }

    return ok(undefined);
  }

  /**
   * Asynchronously disposes this scope and all child scopes.
   *
   * Preferred method for cleanup as it properly handles async dispose operations.
   * Falls back to sync dispose() for services that only implement Disposable.
   *
   * Disposal order (critical):
   * 1. Recursively dispose all children (async)
   * 2. Dispose instances in this scope (async or sync)
   * 3. Clear instance cache
   * 4. Remove from parent's children set
   *
   * @returns Promise with Result indicating success or disposal error
   */
  async disposeAsync(): Promise<Result<void, ContainerError>> {
    if (this.disposed) {
      return err({
        code: "Disposed",
        message: `Scope already disposed: ${this.scopeName}`,
      });
    }

    // Mark as disposed BEFORE disposing children to prevent concurrent operations
    this.disposed = true;

    // Collect disposal errors instead of logging
    const childDisposalErrors: Array<{ scopeName: string; error: ContainerError }> = [];

    // Step 1: Recursively dispose all child scopes (children first!)
    for (const child of this.children) {
      const childResult = await child.disposeAsync();

      if (isErr(childResult)) {
        // Collect error instead of logging
        childDisposalErrors.push({
          scopeName: child.scopeName,
          error: childResult.error,
        });
      }
    }

    // Step 2: Dispose instances in this scope (async)
    const disposeResult = await this.disposeInstancesAsync();
    if (!disposeResult.ok) {
      return disposeResult;
    }

    // Step 3: Clear cache
    this.cache.clear();

    // Step 4: Remove from parent's children set
    if (this.parent !== null) {
      this.parent.children.delete(this);
    }

    // Return aggregated errors if any children failed
    if (childDisposalErrors.length > 0) {
      return err({
        code: "PartialDisposal",
        message: `Failed to dispose ${childDisposalErrors.length} child scope(s)`,
        details: childDisposalErrors,
      });
    }

    return ok(undefined);
  }

  /**
   * Disposes all instances in the cache that implement Disposable (sync).
   *
   * @returns Result indicating success or disposal error
   */
  private disposeInstances(): Result<void, ContainerError> {
    const instances = this.cache.getAllInstances();

    for (const [token, instance] of instances.entries()) {
      if (this.isDisposable(instance)) {
        const result = tryCatch(
          () => instance.dispose(),
          (error): ContainerError => ({
            code: "DisposalFailed",
            message: `Error disposing service ${String(token)}: ${String(error)}`,
            tokenDescription: String(token),
            cause: error,
          })
        );

        if (isErr(result)) {
          return result;
        }
      }
    }

    return ok(undefined);
  }

  /**
   * Disposes all instances in the cache that implement Disposable or AsyncDisposable (async).
   * Prefers async disposal when available, falls back to sync.
   *
   * @returns Promise with Result indicating success or disposal error
   */
  private async disposeInstancesAsync(): Promise<Result<void, ContainerError>> {
    const instances = this.cache.getAllInstances();

    for (const [token, instance] of instances.entries()) {
      // Try async disposal first (preferred)
      if (this.isAsyncDisposable(instance)) {
        try {
          await instance.disposeAsync();
        } catch (error) {
          return err({
            code: "DisposalFailed",
            message: `Error disposing service ${String(token)}: ${String(error)}`,
            tokenDescription: String(token),
            cause: error,
          });
        }
      }
      // Fallback to sync disposal
      else if (this.isDisposable(instance)) {
        const disposableInstance = instance;
        const result = tryCatch(
          () => disposableInstance.dispose(),
          (error): ContainerError => ({
            code: "DisposalFailed",
            message: `Error disposing service ${String(token)}: ${String(error)}`,
            tokenDescription: String(token),
            cause: error,
          })
        );

        if (isErr(result)) {
          return result;
        }
      }
    }

    return ok(undefined);
  }

  /**
   * Type guard to check if an instance implements the Disposable pattern.
   *
   * @param instance - The service instance to check
   * @returns True if instance has dispose() method
   */
  private isDisposable(instance: ServiceType): instance is ServiceType & Disposable {
    return (
      "dispose" in instance &&
      // Narrowing via Partial so we can check dispose presence without full interface
      typeof (instance as Partial<Disposable>).dispose === "function"
    );
  }

  /**
   * Type guard to check if an instance implements the AsyncDisposable pattern.
   *
   * @param instance - The service instance to check
   * @returns True if instance has disposeAsync() method
   */
  private isAsyncDisposable(instance: ServiceType): instance is ServiceType & AsyncDisposable {
    return (
      "disposeAsync" in instance &&
      // Narrowing via Partial so we can check disposeAsync presence without full interface
      typeof (instance as { disposeAsync?: unknown }).disposeAsync === "function"
    );
  }

  /**
   * Checks if this scope is disposed.
   *
   * @returns True if disposed, false otherwise
   */
  isDisposed(): boolean {
    return this.disposed;
  }

  /**
   * Gets the hierarchical scope name.
   *
   * @returns The scope name (e.g., "root.child1.grandchild")
   */
  getScopeName(): string {
    return this.scopeName;
  }

  /**
   * Gets the unique correlation ID for this scope.
   *
   * Useful for tracing and logging in distributed/concurrent scenarios.
   * Each scope gets a unique ID combining name, timestamp, and random string.
   *
   * @returns The unique scope ID (e.g., "root-1730761234567-abc123")
   *
   * @example
   * ```typescript
   * const scope = container.createScope("request").value!;
   * logger.info(`[${scope.getScopeId()}] Processing request`);
   * ```
   */
  getScopeId(): string {
    return this.scopeId;
  }
}
