/**
 * Health check for service container validation state.
 */

import type { HealthCheck } from "./health-check.interface";
import type { ServiceContainer } from "@/di_infrastructure/container";

export class ContainerHealthCheck implements HealthCheck {
  readonly name = "container";

  constructor(private readonly container: ServiceContainer) {}

  check(): boolean {
    return this.container.getValidationState() === "validated";
  }

  getDetails(): string | null {
    const state = this.container.getValidationState();
    return state !== "validated" ? `Container state: ${state}` : null;
  }

  dispose(): void {
    // No cleanup needed - container is managed externally
  }
}
