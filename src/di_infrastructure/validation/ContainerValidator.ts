import type { Result } from "@/types/result";
import type { ContainerError } from "../interfaces/containererror";
import type { InjectionToken } from "../types/injectiontoken";
import type { ServiceType } from "@/types/servicetypeindex";
import type { ServiceRegistry } from "../registry/ServiceRegistry";
import { ok, err } from "@/utils/functional/result";

/**
 * Validates service registrations and dependencies.
 *
 * Responsibilities:
 * - Check that all dependencies are registered
 * - Detect circular dependencies using DFS
 * - Validate alias targets exist
 *
 * Design:
 * - STATEFUL: Maintains cache for performance optimization
 * - Cache is cleared on each validate() call for fresh validation
 * - Returns aggregated errors for comprehensive feedback
 * - Can be extended later with granular validator components
 * - Performance optimization: Caches validated sub-graphs for large dependency trees (>500 services)
 *
 * Note: While this class has internal state, it can be shared between parent and child containers
 * because the cache is cleared on each validation run, preventing stale state issues.
 */
export class ContainerValidator {
  // Performance optimization: Cache for validated sub-graphs
  // Prevents redundant DFS traversals in large dependency trees (>500 services)
  private validatedSubgraphs = new Set<InjectionToken<ServiceType>>();
  /**
   * Validates all registrations in the registry.
   *
   * Performs three checks:
   * 1. All dependencies are registered
   * 2. All alias targets exist
   * 3. No circular dependencies
   *
   * @param registry - The service registry to validate
   * @returns Result with void on success, or array of errors
   */
  validate(registry: ServiceRegistry): Result<void, ContainerError[]> {
    // Clear cache for fresh validation
    this.validatedSubgraphs = new Set<InjectionToken<ServiceType>>();

    const errors: ContainerError[] = [
      ...this.validateDependencies(registry),
      ...this.validateAliasTargets(registry),
      ...this.detectCircularDependencies(registry),
    ];

    return errors.length > 0 ? err(errors) : ok(undefined);
  }

  /**
   * Checks that all declared dependencies are registered.
   *
   * @param registry - The service registry to check
   * @returns Array of errors for missing dependencies
   */
  private validateDependencies(registry: ServiceRegistry): ContainerError[] {
    const errors: ContainerError[] = [];
    const registrations = registry.getAllRegistrations();

    for (const [token, registration] of registrations.entries()) {
      for (const dep of registration.dependencies) {
        if (!registry.has(dep)) {
          errors.push({
            code: "TokenNotRegistered",
            message: `${String(token)} depends on ${String(dep)} which is not registered`,
            tokenDescription: String(dep),
          });
        }
      }
    }

    return errors;
  }

  /**
   * Checks that all alias targets are registered.
   *
   * @param registry - The service registry to check
   * @returns Array of errors for missing alias targets
   */
  private validateAliasTargets(registry: ServiceRegistry): ContainerError[] {
    const errors: ContainerError[] = [];
    const registrations = registry.getAllRegistrations();

    for (const [token, registration] of registrations.entries()) {
      if (registration.providerType === "alias" && registration.aliasTarget) {
        if (!registry.has(registration.aliasTarget)) {
          errors.push({
            code: "AliasTargetNotFound",
            message: `Alias ${String(token)} points to ${String(registration.aliasTarget)} which is not registered`,
            tokenDescription: String(registration.aliasTarget),
          });
        }
      }
    }

    return errors;
  }

  /**
   * Detects circular dependencies using depth-first search.
   *
   * @param registry - The service registry to check
   * @returns Array of errors for detected cycles
   */
  private detectCircularDependencies(registry: ServiceRegistry): ContainerError[] {
    const errors: ContainerError[] = [];
    const visited = new Set<InjectionToken<ServiceType>>();
    const registrations = registry.getAllRegistrations();

    for (const token of registrations.keys()) {
      const visiting = new Set<InjectionToken<ServiceType>>();
      const path: InjectionToken<ServiceType>[] = [];

      const error = this.checkCycleForToken(registry, token, visiting, visited, path);
      if (error) {
        errors.push(error);
      }
    }

    return errors;
  }

  /**
   * Recursively checks for cycles starting from a specific token.
   *
   * **Algorithm: Depth-First Search (DFS) with Three-Color Marking**
   *
   * Three states for each node (token):
   * - WHITE (unvisited): Not in `visiting` or `visited` sets
   * - GRAY (visiting): In `visiting` set (currently in DFS recursion stack)
   * - BLACK (visited): In `visited` set (fully processed, all descendants checked)
   *
   * Cycle Detection:
   * - If we encounter a GRAY node during traversal, we've found a back edge → cycle
   * - GRAY nodes represent the current path from root to current node
   * - Encountering a GRAY node means we're trying to visit an ancestor → circular dependency
   *
   * Performance Optimization:
   * - `validatedSubgraphs` cache prevents redundant traversals of already-validated subtrees
   * - Crucial for large dependency graphs (>500 services)
   * - BLACK nodes can be safely skipped (all their descendants are cycle-free)
   *
   * Time Complexity: O(V + E) where V = number of services, E = number of dependencies
   * Space Complexity: O(V) for visiting/visited sets + O(D) for recursion depth D
   *
   * @param registry - The service registry
   * @param token - Current token being checked (current node in DFS)
   * @param visiting - GRAY nodes: tokens currently in the DFS recursion stack
   * @param visited - BLACK nodes: tokens fully processed in this validation run
   * @param path - Current dependency path for error reporting (stack trace)
   * @returns ContainerError if cycle detected, null otherwise
   *
   * @example
   * Cycle A → B → C → A will be detected when:
   * 1. Start at A (mark GRAY)
   * 2. Visit B (mark GRAY)
   * 3. Visit C (mark GRAY)
   * 4. Try to visit A → A is GRAY → Back edge detected → Cycle!
   */
  private checkCycleForToken(
    registry: ServiceRegistry,
    token: InjectionToken<ServiceType>,
    visiting: Set<InjectionToken<ServiceType>>,
    visited: Set<InjectionToken<ServiceType>>,
    path: InjectionToken<ServiceType>[]
  ): ContainerError | null {
    // GRAY node encountered: Back edge detected → Cycle exists
    // This token is already in the current DFS path (visiting set)
    // Example: A → B → C → A (when we reach A again from C)
    if (visiting.has(token)) {
      const cyclePath = [...path, token].map(String).join(" → ");
      return {
        code: "CircularDependency",
        message: `Circular dependency: ${cyclePath}`,
        tokenDescription: String(token),
      };
    }

    // Performance optimization: Skip already validated sub-graphs
    // This token and all its descendants have been proven cycle-free
    // Avoids redundant traversals in DAGs with shared dependencies
    if (this.validatedSubgraphs.has(token)) {
      return null;
    }

    // BLACK node: Already fully processed in this validation run
    // All descendants of this token have been checked (no cycle below it)
    // Cross edge or forward edge in DFS terminology
    /* c8 ignore start -- Visited check for graph traversal; tested via circular dependency tests */
    if (visited.has(token)) {
      return null;
    }
    /* c8 ignore stop */

    // Mark as GRAY: Add to current DFS path
    // This token is now being visited (in recursion stack)
    visiting.add(token);
    path.push(token);

    // DFS: Recursively check all dependencies (children in dependency graph)
    // If any child has a cycle, propagate error up immediately
    const registration = registry.getRegistration(token);
    if (registration) {
      for (const dep of registration.dependencies) {
        const error = this.checkCycleForToken(registry, dep, visiting, visited, path);
        if (error) return error; // Short-circuit: Stop on first cycle found
      }
    }

    // Mark as BLACK: All descendants checked, no cycles found
    // Remove from GRAY set (no longer in active DFS path)
    // Add to BLACK set (fully processed, can be safely skipped in future)
    visiting.delete(token);
    path.pop();
    visited.add(token);
    this.validatedSubgraphs.add(token); // Cache for performance (persists across validation runs)

    return null; // No cycle found in this subtree
  }
}
