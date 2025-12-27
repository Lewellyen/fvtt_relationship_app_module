import type { ServiceContainer } from "@/infrastructure/di/container";
import type { Result } from "@/domain/types/result";
import { ok, err, isErr } from "@/domain/utils/result";

/**
 * Represents a single step in the dependency registration process.
 * Steps are executed in priority order (lower priority = earlier execution).
 */
export interface DependencyRegistrationStep {
  /** Human-readable name for logging and error messages */
  name: string;
  /** Priority determines execution order (lower = earlier). Use increments of 10 for flexibility. */
  priority: number;
  /** Function to execute for this registration step */
  execute: (container: ServiceContainer) => Result<void, string>;
}

/**
 * Registry for dependency registration steps.
 * Allows adding new registration steps without modifying configureDependencies.
 *
 * DESIGN: Uses Registry Pattern to follow Open/Closed Principle:
 * - Open for extension: New steps can be added via register()
 * - Closed for modification: configureDependencies doesn't need to change
 */
export class DependencyRegistrationRegistry {
  private steps: DependencyRegistrationStep[] = [];

  /**
   * Registers a new dependency registration step.
   * Steps are automatically sorted by priority after registration.
   * If a step with the same name already exists, it will be replaced.
   *
   * @param step - The registration step to add
   */
  register(step: DependencyRegistrationStep): void {
    // Remove existing step with same name if present (allows re-registration)
    this.steps = this.steps.filter((s) => s.name !== step.name);
    this.steps.push(step);
    this.steps.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Resets the registry by clearing all registered steps.
   * This is primarily useful for testing scenarios where a clean state is needed.
   */
  reset(): void {
    this.steps = [];
  }

  /**
   * Executes all registered steps in priority order.
   * Stops at first error and returns it.
   *
   * @param container - The service container to configure
   * @returns Result indicating success or the first error encountered
   */
  configure(container: ServiceContainer): Result<void, string> {
    for (const step of this.steps) {
      const result = step.execute(container);
      if (isErr(result)) {
        return err(`Failed at step '${step.name}': ${result.error}`);
      }
    }
    return ok(undefined);
  }
}

/**
 * Global dependency registration registry instance.
 * Modules can register their dependency registration steps via registerDependencyStep().
 *
 * DESIGN: Singleton pattern for global extensibility.
 * Modules import this registry and register their steps at module load time.
 */
export const dependencyRegistry = new DependencyRegistrationRegistry();

/**
 * Registers a dependency registration step in the global registry.
 *
 * This function allows modules to register their dependency registration steps
 * without modifying the core dependency configuration. This follows the
 * Open/Closed Principle - the system is open for extension but closed for modification.
 *
 * @param step - The registration step to add
 *
 * @example
 * ```typescript
 * import { registerDependencyStep } from "@/framework/config/dependency-registry";
 * import { registerMyServices } from "./my-services.config";
 *
 * // Module registers itself at import time
 * registerDependencyStep({
 *   name: "MyServices",
 *   priority: 50,
 *   execute: registerMyServices,
 * });
 * ```
 */
export function registerDependencyStep(step: DependencyRegistrationStep): void {
  dependencyRegistry.register(step);
}
