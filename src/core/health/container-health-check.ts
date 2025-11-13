import type { ServiceContainer } from "@/di_infrastructure/container";
import type { HealthCheck } from "./health-check.interface";
import type { HealthCheckRegistry } from "./health-check-registry";
import { healthCheckRegistryToken, serviceContainerToken } from "@/tokens/tokenindex";

/**
 * Health check validating that the service container completed its bootstrap phase.
 */
export class ContainerHealthCheck implements HealthCheck {
  readonly name = "container";
  private readonly container: ServiceContainer;

  constructor(container: ServiceContainer) {
    this.container = container;
  }

  check(): boolean {
    return this.container.getValidationState() === "validated";
  }

  getDetails(): string | null {
    const state = this.container.getValidationState();
    if (state !== "validated") {
      return `Container state: ${state}`;
    }
    return null;
  }

  dispose(): void {
    // Nothing to clean up – the container owns its own lifecycle.
  }
}

export class DIContainerHealthCheck extends ContainerHealthCheck {
  static dependencies = [serviceContainerToken, healthCheckRegistryToken] as const;

  constructor(container: ServiceContainer, registry: HealthCheckRegistry) {
    super(container);
    registry.register(this);
  }
}
