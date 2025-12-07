import type { PlatformHealthCheckPort } from "@/domain/ports/platform-health-check-port.interface";
import type { HealthCheck } from "@/domain/types/health-check";
import { HealthCheckRegistry } from "@/application/health/HealthCheckRegistry";

/**
 * Infrastructure adapter that wraps HealthCheckRegistry as PlatformHealthCheckPort.
 */
export class HealthCheckRegistryAdapter implements PlatformHealthCheckPort {
  private readonly registry: HealthCheckRegistry;

  constructor() {
    this.registry = new HealthCheckRegistry();
  }

  register(check: HealthCheck): void {
    this.registry.register(check);
  }

  unregister(name: string): void {
    this.registry.unregister(name);
  }

  runAll(): Map<string, boolean> {
    return this.registry.runAll();
  }

  getCheck(name: string): HealthCheck | undefined {
    return this.registry.getCheck(name);
  }

  getAllChecks(): HealthCheck[] {
    return this.registry.getAllChecks();
  }
}
