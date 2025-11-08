/* eslint-disable @typescript-eslint/no-explicit-any */
// Test file: `any` needed for dummy token registration

import { describe, it, expect, beforeEach } from "vitest";
import { ModuleHealthService } from "../module-health-service";
import { ServiceContainer } from "@/di_infrastructure/container";
import { MetricsCollector } from "@/observability/metrics-collector";
import { createMockEnvironmentConfig } from "@/test/utils/test-helpers";
import { createInjectionToken } from "@/di_infrastructure/tokenutilities";

describe("ModuleHealthService", () => {
  let container: ServiceContainer;
  let metricsCollector: MetricsCollector;
  let healthService: ModuleHealthService;

  beforeEach(() => {
    container = ServiceContainer.createRoot();
    const mockEnv = createMockEnvironmentConfig();
    metricsCollector = new MetricsCollector(mockEnv);
    healthService = new ModuleHealthService(container, metricsCollector);
  });

  describe("getHealth", () => {
    it("should return healthy status when container is validated", () => {
      // Register a dummy service and validate
      const dummyToken = createInjectionToken("Dummy");
      container.registerValue(dummyToken, { test: "value" } as any);
      container.validate();

      const health = healthService.getHealth();

      expect(health.status).toBe("healthy");
      expect(health.checks.containerValidated).toBe(true);
      expect(health.timestamp).toBeDefined();
    });

    it("should return unhealthy status when container is not validated", () => {
      // Don't validate container
      const health = healthService.getHealth();

      expect(health.status).toBe("unhealthy");
      expect(health.checks.containerValidated).toBe(false);
    });

    it("should return degraded status when resolution errors exist", () => {
      // Register and validate
      const dummyToken = createInjectionToken("Dummy");
      container.registerValue(dummyToken, { test: "value" } as any);
      container.validate();

      // Simulate resolution errors
      metricsCollector.recordResolution(dummyToken as any, 1.0, false);

      const health = healthService.getHealth();

      expect(health.status).toBe("degraded");
      expect(health.checks.containerValidated).toBe(true);
    });

    it("should return degraded status when port selection failures exist", () => {
      // Register and validate
      const dummyToken = createInjectionToken("Dummy");
      container.registerValue(dummyToken, { test: "value" } as any);
      container.validate();

      // Simulate port selection failure
      metricsCollector.recordPortSelectionFailure(12);

      const health = healthService.getHealth();

      expect(health.status).toBe("degraded");
      expect(health.checks.lastError).toContain("12");
    });

    it("should check portsSelected based on metrics", () => {
      // Register and validate
      const dummyToken = createInjectionToken("Dummy");
      container.registerValue(dummyToken, { test: "value" } as any);
      container.validate();

      // Record successful port selection
      metricsCollector.recordPortSelection(13);

      const health = healthService.getHealth();

      expect(health.checks.portsSelected).toBe(true);
    });

    it("should fallback to containerValidated for portsSelected when no metrics", () => {
      // Register and validate (no port selections recorded)
      const dummyToken = createInjectionToken("Dummy");
      container.registerValue(dummyToken, { test: "value" } as any);
      container.validate();

      const health = healthService.getHealth();

      // Should still be true because container is validated
      expect(health.checks.portsSelected).toBe(true);
    });

    it("should include timestamp in ISO format", () => {
      const dummyToken = createInjectionToken("Dummy");
      container.registerValue(dummyToken, { test: "value" } as any);
      container.validate();

      const health = healthService.getHealth();

      expect(health.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it("should have no lastError when healthy", () => {
      const dummyToken = createInjectionToken("Dummy");
      container.registerValue(dummyToken, { test: "value" } as any);
      container.validate();

      const health = healthService.getHealth();

      expect(health.checks.lastError).toBeNull();
    });
  });

  describe("Dependencies", () => {
    it("should declare metricsCollectorToken as dependency", () => {
      // Dependencies is an array of tokens (symbols), not objects
      expect(ModuleHealthService.dependencies).toHaveLength(1);
      expect(ModuleHealthService.dependencies[0]).toBeDefined();
      expect(String(ModuleHealthService.dependencies[0])).toContain("MetricsCollector");
    });
  });
});
