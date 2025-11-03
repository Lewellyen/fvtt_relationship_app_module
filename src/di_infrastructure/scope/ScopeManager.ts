import type { Result } from "@/types/result";
import type { ContainerError } from "../interfaces/containererror";
import type { ServiceType } from "@/types/servicetypeindex";
import { InstanceCache } from "../cache/InstanceCache";
import { ok, err, tryCatch, isErr } from "@/utils/result";

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
 * - Dispose instances (including Disposable pattern support)
 * - Cascade disposal to children
 *
 * Design:
 * - NO dependency on ServiceResolver (avoids circular dependency)
 * - createChild() returns data for facade to build new container
 * - Disposal order: children first, then instances (critical!)
 */
export class ScopeManager {
  private children = new Set<ScopeManager>();
  private disposed = false;

  constructor(
    private readonly scopeName: string,
    private readonly parent: ScopeManager | null,
    private readonly cache: InstanceCache
  ) {}

  /**
   * Creates a child scope manager.
   *
   * Note: Returns data (scopeName, cache, childManager) instead of full container
   * to avoid circular dependency with ServiceResolver.
   *
   * @param name - Optional custom name for the scope
   * @returns Result with child scope data or error if disposed
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

    // Build hierarchical scope name
    const uniqueId = name ?? `scope-${generateScopeId()}`;
    const childScopeName = `${this.scopeName}.${uniqueId}`;

    // Create new cache for child
    const childCache = new InstanceCache();

    // Create child manager
    const childManager = new ScopeManager(childScopeName, this, childCache);

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

    // Step 1: Recursively dispose all child scopes (children first!)
    for (const child of this.children) {
      const childResult = child.dispose();

      if (isErr(childResult)) {
        // Log warning but continue disposal
        console.warn(`Failed to dispose child scope ${child.scopeName}:`, childResult.error);
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

    return ok(undefined);
  }

  /**
   * Disposes all instances in the cache that implement Disposable.
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
   * Type guard to check if an instance implements the Disposable pattern.
   *
   * Checks for:
   * - dispose() method (function)
   * - Future: Symbol.dispose support
   *
   * @param instance - The service instance to check
   * @returns True if instance has dispose() method
   */
  private isDisposable(instance: ServiceType): instance is ServiceType & { dispose: () => void } {
    return (
      "dispose" in instance &&
      typeof (instance as ServiceType & { dispose: unknown }).dispose === "function"
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
}
