// Test file: `any` needed for dummy token registration

import { describe, it, expect, beforeEach, vi } from "vitest";
import { ModuleHealthService } from "../module-health-service";
import { HealthCheckRegistry } from "@/core/health/health-check-registry";
import type { HealthCheck } from "@/core/health/health-check.interface";

describe("ModuleHealthService", () => {
  let registry: HealthCheckRegistry;
  let healthService: ModuleHealthService;
  let mockContainerCheck: HealthCheck;
  let mockMetricsCheck: HealthCheck;

  beforeEach(() => {
    registry = new HealthCheckRegistry();

    // Mock container health check
    mockContainerCheck = {
      name: "container",
      check: vi.fn().mockReturnValue(true),
      getDetails: vi.fn().mockReturnValue(null) as () => string | null,
      dispose: vi.fn(),
    };

    // Mock metrics health check
    mockMetricsCheck = {
      name: "metrics",
      check: vi.fn().mockReturnValue(true),
      getDetails: vi.fn().mockReturnValue(null) as () => string | null,
      dispose: vi.fn(),
    };

    // Register checks
    registry.register(mockContainerCheck);
    registry.register(mockMetricsCheck);

    healthService = new ModuleHealthService(registry);
  });

  describe("getHealth", () => {
    it("should return healthy status when all checks pass", () => {
      vi.mocked(mockContainerCheck.check).mockReturnValue(true);
      vi.mocked(mockMetricsCheck.check).mockReturnValue(true);

      const health = healthService.getHealth();

      expect(health.status).toBe("healthy");
      expect(health.checks.containerValidated).toBe(true);
      expect(health.checks.portsSelected).toBe(true);
      expect(health.checks.lastError).toBeNull();
      expect(health.timestamp).toBeDefined();
    });

    it("should return unhealthy status when container check fails", () => {
      vi.mocked(mockContainerCheck.check).mockReturnValue(false);
      vi.mocked(mockContainerCheck.getDetails!).mockReturnValue("Container state: not_validated");
      vi.mocked(mockMetricsCheck.check).mockReturnValue(true);

      const health = healthService.getHealth();

      expect(health.status).toBe("unhealthy");
      expect(health.checks.containerValidated).toBe(false);
      expect(health.checks.lastError).toBe("Container state: not_validated");
    });

    it("should return degraded status when metrics check fails", () => {
      vi.mocked(mockContainerCheck.check).mockReturnValue(true);
      vi.mocked(mockMetricsCheck.check).mockReturnValue(false);
      vi.mocked(mockMetricsCheck.getDetails!).mockReturnValue("Port selection failures: 12");

      const health = healthService.getHealth();

      expect(health.status).toBe("degraded");
      expect(health.checks.containerValidated).toBe(true);
      expect(health.checks.portsSelected).toBe(false);
      expect(health.checks.lastError).toBe("Port selection failures: 12");
    });

    it("should handle checks without getDetails method", () => {
      const checkWithoutDetails: HealthCheck = {
        name: "simple",
        check: vi.fn().mockReturnValue(false),
        dispose: vi.fn(),
        // No getDetails method
      };
      registry.register(checkWithoutDetails);
      vi.mocked(mockContainerCheck.check).mockReturnValue(true);
      vi.mocked(mockMetricsCheck.check).mockReturnValue(true);

      const health = healthService.getHealth();

      // Should not crash and lastError should be null (no getDetails available)
      expect(health.checks.lastError).toBeNull();
    });

    it("should call getDetails when check fails and getDetails is present", () => {
      vi.mocked(mockContainerCheck.check).mockReturnValue(false);
      vi.mocked(mockContainerCheck.getDetails!).mockReturnValue("Container failed");
      vi.mocked(mockMetricsCheck.check).mockReturnValue(true);

      const health = healthService.getHealth();

      expect(mockContainerCheck.getDetails).toHaveBeenCalled();
      expect(health.checks.lastError).toBe("Container failed");
    });

    it("should include timestamp in ISO format", () => {
      const health = healthService.getHealth();
      expect(health.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it("should aggregate results from all registered checks", () => {
      vi.mocked(mockContainerCheck.check).mockReturnValue(true);
      vi.mocked(mockMetricsCheck.check).mockReturnValue(true);

      const health = healthService.getHealth();

      expect(mockContainerCheck.check).toHaveBeenCalled();
      expect(mockMetricsCheck.check).toHaveBeenCalled();
      expect(health.status).toBe("healthy");
    });

    it("should return healthy for container when no container check registered", () => {
      // Create registry without container check
      const tempRegistry = new HealthCheckRegistry();
      tempRegistry.register(mockMetricsCheck);
      vi.mocked(mockMetricsCheck.check).mockReturnValue(true);

      const service = new ModuleHealthService(tempRegistry);
      const health = service.getHealth();

      expect(health.checks.containerValidated).toBe(true); // defaults to true
    });

    it("should return healthy for metrics when no metrics check registered", () => {
      // Create registry without metrics check
      const tempRegistry = new HealthCheckRegistry();
      tempRegistry.register(mockContainerCheck);
      vi.mocked(mockContainerCheck.check).mockReturnValue(true);

      const service = new ModuleHealthService(tempRegistry);
      const health = service.getHealth();

      expect(health.checks.portsSelected).toBe(true); // defaults to true
    });

    it("should handle check that returns true without undefined fallback", () => {
      const tempCheck: HealthCheck = {
        name: "temp",
        check: vi.fn().mockReturnValue(true), // Returns true directly
        dispose: vi.fn(),
      };
      registry.register(tempCheck);
      vi.mocked(mockContainerCheck.check).mockReturnValue(true);
      vi.mocked(mockMetricsCheck.check).mockReturnValue(true);

      const health = healthService.getHealth();

      // All checks passed
      expect(health.status).toBe("healthy");
    });
  });

  describe("Dependencies", () => {
    it("should declare healthCheckRegistryToken as dependency", () => {
      expect(ModuleHealthService.dependencies).toHaveLength(1);
      expect(ModuleHealthService.dependencies[0]).toBeDefined();
      expect(String(ModuleHealthService.dependencies[0])).toContain("HealthCheckRegistry");
    });
  });
});
