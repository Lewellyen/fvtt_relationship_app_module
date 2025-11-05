import type { Result } from "@/types/result";
import type { ContainerError } from "../interfaces/containererror";
import type { InjectionToken } from "../types/injectiontoken";
import type { ServiceType } from "@/types/servicetypeindex";
import type { ServiceRegistry } from "../registry/ServiceRegistry";
import { ok, err } from "@/utils/result";

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
   * Uses DFS with visiting/visited sets to detect back edges (cycles).
   * Performance optimization: Uses Set cache to skip already-validated sub-graphs.
   *
   * @param registry - The service registry
   * @param token - Current token being checked
   * @param visiting - Set of tokens in current DFS path
   * @param visited - Set of tokens already fully processed
   * @param path - Current path for error reporting
   * @returns ContainerError if cycle detected, null otherwise
   */
  private checkCycleForToken(
    registry: ServiceRegistry,
    token: InjectionToken<ServiceType>,
    visiting: Set<InjectionToken<ServiceType>>,
    visited: Set<InjectionToken<ServiceType>>,
    path: InjectionToken<ServiceType>[]
  ): ContainerError | null {
    // Cycle detected: token is already in current path
    if (visiting.has(token)) {
      const cyclePath = [...path, token].map(String).join(" → ");
      return {
        code: "CircularDependency",
        message: `Circular dependency: ${cyclePath}`,
        tokenDescription: String(token),
      };
    }

    // Performance optimization: Skip already validated sub-graphs
    if (this.validatedSubgraphs.has(token)) {
      return null;
    }

    // Already fully processed this token in current validation run
    if (visited.has(token)) {
      return null;
    }

    // Mark as visiting and add to path
    visiting.add(token);
    path.push(token);

    // Check all dependencies
    const registration = registry.getRegistration(token);
    if (registration) {
      for (const dep of registration.dependencies) {
        const error = this.checkCycleForToken(registry, dep, visiting, visited, path);
        if (error) return error;
      }
    }

    // Done visiting this token - mark as validated
    visiting.delete(token);
    path.pop();
    visited.add(token);
    this.validatedSubgraphs.add(token); // Cache for performance

    return null;
  }
}
