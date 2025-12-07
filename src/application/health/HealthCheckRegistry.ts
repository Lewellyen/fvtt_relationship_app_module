/**
 * Registry for health checks.
 * Services can register themselves for health monitoring.
 */

import type { ApplicationDisposable } from "@/application/interfaces/application-disposable.interface";
import type { HealthCheck } from "@/domain/types/health-check";

export class HealthCheckRegistry implements ApplicationDisposable {
  static dependencies = [] as const;

  private checks = new Map<string, HealthCheck>();

  register(check: HealthCheck): void {
    this.checks.set(check.name, check);
  }

  unregister(name: string): void {
    this.checks.delete(name);
  }

  runAll(): Map<string, boolean> {
    const results = new Map<string, boolean>();
    for (const [name, check] of this.checks) {
      results.set(name, check.check());
    }
    return results;
  }

  getCheck(name: string): HealthCheck | undefined {
    return this.checks.get(name);
  }

  getAllChecks(): HealthCheck[] {
    return Array.from(this.checks.values());
  }

  dispose(): void {
    for (const check of this.checks.values()) {
      check.dispose();
    }
    this.checks.clear();
  }
}

export class DIHealthCheckRegistry extends HealthCheckRegistry {
  static override dependencies = [] as const;

  constructor() {
    super();
  }
}
