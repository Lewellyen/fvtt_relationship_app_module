import type { Result } from "@/domain/types/result";
import { ok } from "@/domain/utils/result";
import type { PlatformMetricsInitializationPort } from "@/domain/ports/bootstrap/platform-metrics-initialization-port.interface";
import { isInitializable } from "@/infrastructure/shared/utils/type-guards";
import type { MetricsCollector } from "@/infrastructure/observability/metrics-collector";
import { metricsCollectorToken } from "@/infrastructure/shared/tokens/observability/metrics-collector.token";

/**
 * Infrastructure adapter for PlatformMetricsInitializationPort.
 *
 * Wraps MetricsCollector and calls initialize() if supported (persistence variant).
 */
export class MetricsInitializationAdapter implements PlatformMetricsInitializationPort {
  constructor(private readonly collector: MetricsCollector) {}

  initialize(): Result<void, string> {
    if (isInitializable(this.collector)) {
      return this.collector.initialize();
    }
    return ok(undefined);
  }
}

export class DIMetricsInitializationAdapter extends MetricsInitializationAdapter {
  static dependencies = [metricsCollectorToken] as const;

  constructor(collector: MetricsCollector) {
    super(collector);
  }
}
