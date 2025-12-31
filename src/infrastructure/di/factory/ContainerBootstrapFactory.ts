import type { EnvironmentConfig } from "@/domain/types/environment-config";
import type { ServiceContainer } from "@/infrastructure/di/container";
import { ServiceContainer as ServiceContainerImpl } from "@/infrastructure/di/container";
import { ServiceRegistry } from "@/infrastructure/di/registry/ServiceRegistry";
import { ContainerValidator } from "@/infrastructure/di/validation/ContainerValidator";
import { InstanceCache } from "@/infrastructure/di/cache/InstanceCache";
import { ServiceResolver } from "@/infrastructure/di/resolution/ServiceResolver";
import { ScopeManager } from "@/infrastructure/di/scope/ScopeManager";
import { BootstrapPerformanceTracker } from "@/infrastructure/observability/bootstrap-performance-tracker";
import { RuntimeConfigAdapter } from "@/infrastructure/config/runtime-config-adapter";

/**
 * Factory for creating ServiceContainer instances with bootstrap dependencies.
 *
 * **Responsibility:** Bootstrap orchestration (SRP).
 * Encapsulates the creation of bootstrap-specific components:
 * - RuntimeConfig creation
 * - BootstrapPerformanceTracker creation
 * - ServiceResolver with performance tracking
 * - ServiceContainer assembly
 *
 * **Design Rationale:**
 * Separates bootstrap concerns from container logic, following Single Responsibility Principle.
 * ServiceContainer is now a pure DI container without bootstrap/observability knowledge.
 *
 * **Architecture:**
 * Located in infrastructure layer (can import from infrastructure, application, domain).
 * This factory creates infrastructure components and is used by both:
 * - ServiceContainer.createRoot() (infrastructure -> infrastructure, no violation)
 * - ContainerFactory (framework -> infrastructure, allowed)
 *
 * @example
 * ```typescript
 * const factory = new ContainerBootstrapFactory();
 * const container = factory.createRoot(ENV);
 * ```
 */
export class ContainerBootstrapFactory {
  /**
   * Creates a root ServiceContainer with bootstrap dependencies.
   *
   * Creates and wires:
   * - RuntimeConfig from environment
   * - BootstrapPerformanceTracker (no MetricsCollector during bootstrap)
   * - ServiceResolver with performance tracking
   * - ServiceContainer with all dependencies
   *
   * @param env - Environment configuration
   * @returns A new root ServiceContainer
   */
  createRoot(env: EnvironmentConfig): ServiceContainer {
    const registry = new ServiceRegistry();
    const validator = new ContainerValidator();
    const cache = new InstanceCache();
    const scopeManager = new ScopeManager("root", null, cache);

    // Create bootstrap dependencies
    const runtimeConfig = new RuntimeConfigAdapter(env);
    const performanceTracker = new BootstrapPerformanceTracker(runtimeConfig, null);
    const resolver = new ServiceResolver(registry, cache, null, "root", performanceTracker);

    return new ServiceContainerImpl(
      registry,
      validator,
      cache,
      resolver,
      scopeManager,
      "registering",
      env
    );
  }

  /**
   * Creates a child scope container with bootstrap dependencies.
   *
   * Creates and wires:
   * - RuntimeConfig from parent's environment
   * - BootstrapPerformanceTracker for child scope
   * - ServiceResolver with performance tracking
   * - Child ServiceContainer with all dependencies
   *
   * @param parent - Parent container
   * @param name - Optional custom name for the scope
   * @returns Result with child container or error
   */
  createScope(
    parent: ServiceContainer,
    name?: string
  ): ReturnType<ServiceContainer["createScope"]> {
    // Use internal createScope method (will be refactored to use this factory)
    return parent.createScope(name);
  }
}
