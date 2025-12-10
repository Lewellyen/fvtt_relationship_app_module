import { describe, it, expect, vi } from "vitest";
import { MetricsInjectionManager } from "../MetricsInjectionManager";
import { ServiceResolver } from "../../resolution/ServiceResolver";
import { InstanceCache } from "../../cache/InstanceCache";
import type { MetricsCollector } from "@/infrastructure/observability/metrics-collector";
import type { Result } from "@/domain/types/result";
import { ok } from "@/domain/utils/result";

describe("MetricsInjectionManager", () => {
  describe("injectMetricsCollector", () => {
    it("should return ok result", () => {
      const resolver = {} as ServiceResolver;
      const cache = {} as InstanceCache;
      const resolveMetricsCollector = vi.fn(() => ok({} as MetricsCollector));

      const manager = new MetricsInjectionManager(resolver, cache, resolveMetricsCollector);

      const result = manager.injectMetricsCollector();

      expectResultOk(result);
    });
  });

  describe("performInjection", () => {
    it("should inject metrics collector into resolver and cache", () => {
      const resolver = {
        setMetricsCollector: vi.fn(),
      } as unknown as ServiceResolver;
      const cache = {
        setMetricsCollector: vi.fn(),
      } as unknown as InstanceCache;
      const resolveMetricsCollector = vi.fn(() => ok({} as MetricsCollector));

      const manager = new MetricsInjectionManager(resolver, cache, resolveMetricsCollector);

      const collector = {
        recordResolution: vi.fn(),
        recordCacheAccess: vi.fn(),
      } as unknown as MetricsCollector;

      manager.performInjection(collector);

      expect(resolver.setMetricsCollector).toHaveBeenCalledWith(collector);
      expect(cache.setMetricsCollector).toHaveBeenCalledWith(collector);
    });
  });
});

function expectResultOk<T>(result: Result<T, unknown>): asserts result is { ok: true; value: T } {
  expect(result.ok).toBe(true);
  if (!result.ok) {
    throw new Error(`Expected Result to be Ok, but got error: ${JSON.stringify(result.error)}`);
  }
}
