import type { PlatformContainerPort } from "@/domain/ports/platform-container-port.interface";
import type { HealthCheck } from "./health-check.interface";
import type { HealthCheckRegistry } from "./HealthCheckRegistry";
import { healthCheckRegistryToken } from "@/infrastructure/shared/tokens/core/health-check-registry.token";
import { platformContainerPortToken } from "@/application/tokens/domain-ports.tokens";

/**
 * Health check validating that the service container completed its bootstrap phase.
 */
export class ContainerHealthCheck implements HealthCheck {
  readonly name = "container";
  private readonly container: PlatformContainerPort;

  constructor(container: PlatformContainerPort) {
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
  static dependencies = [platformContainerPortToken, healthCheckRegistryToken] as const;

  constructor(container: PlatformContainerPort, registry: HealthCheckRegistry) {
    super(container);
    registry.register(this);
  }
}
