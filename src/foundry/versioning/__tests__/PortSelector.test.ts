import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { PortSelector } from "../portselector";
import { getFoundryVersionResult, resetVersionCache } from "../versiondetector";
import { expectResultOk, expectResultErr } from "@/test/utils/test-helpers";
import { ok, err } from "@/utils/result";
import { ENV } from "@/config/environment";
import { MetricsCollector } from "@/observability/metrics-collector";

vi.mock("../versiondetector", () => ({
  getFoundryVersionResult: vi.fn(),
  resetVersionCache: vi.fn(),
}));

describe("PortSelector", () => {
  let selector: PortSelector;

  beforeEach(() => {
    selector = new PortSelector();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    resetVersionCache(); // Clear version cache for test isolation
  });

  describe("selectPortFromFactories", () => {
    it("should select highest compatible port version", () => {
      const factories = new Map([
        [13, () => "port-v13"],
        [14, () => "port-v14"],
        [15, () => "port-v15"],
      ]);

      vi.mocked(getFoundryVersionResult).mockReturnValue(ok(14));

      const result = selector.selectPortFromFactories(factories);
      expectResultOk(result);
      expect(result.value).toBe("port-v14");
    });

    it("should fallback to lower version when exact match not available", () => {
      const factories = new Map([
        [13, () => "port-v13"],
        [15, () => "port-v15"],
      ]);

      vi.mocked(getFoundryVersionResult).mockReturnValue(ok(14));

      const result = selector.selectPortFromFactories(factories);
      expectResultOk(result);
      expect(result.value).toBe("port-v13");
    });

    it("should ignore ports with version higher than Foundry version", () => {
      const factories = new Map([
        [13, () => "port-v13"],
        [15, () => "port-v15"],
      ]);

      vi.mocked(getFoundryVersionResult).mockReturnValue(ok(13));

      const result = selector.selectPortFromFactories(factories);
      expectResultOk(result);
      expect(result.value).toBe("port-v13");
    });

    it("should fail when no compatible port available", () => {
      const factories = new Map([
        [14, () => "port-v14"],
        [15, () => "port-v15"],
      ]);

      vi.mocked(getFoundryVersionResult).mockReturnValue(ok(13));

      const result = selector.selectPortFromFactories(factories);
      expectResultErr(result);
      expect(result.error.code).toBe("PORT_SELECTION_FAILED");
      expect(result.error.message).toContain("No compatible port found");
    });

    it("should use provided foundryVersion parameter", () => {
      const factories = new Map([
        [13, () => "port-v13"],
        [14, () => "port-v14"],
      ]);

      const result = selector.selectPortFromFactories(factories, 14);
      expectResultOk(result);
      expect(result.value).toBe("port-v14");
      expect(getFoundryVersionResult).not.toHaveBeenCalled();
    });

    it("should detect Foundry version when not provided", () => {
      const factories = new Map([[13, () => "port-v13"]]);

      vi.mocked(getFoundryVersionResult).mockReturnValue(ok(13));

      const result = selector.selectPortFromFactories(factories);
      expectResultOk(result);
      expect(result.value).toBe("port-v13");
      expect(getFoundryVersionResult).toHaveBeenCalled();
    });

    it("should handle version detection errors", () => {
      const factories = new Map([[13, () => "port-v13"]]);

      vi.mocked(getFoundryVersionResult).mockReturnValue(err("Version detection failed"));

      const result = selector.selectPortFromFactories(factories);
      expectResultErr(result);
      expect(result.error.code).toBe("PORT_SELECTION_FAILED");
      expect(result.error.message).toContain("Could not determine Foundry version");
    });

    it("should select exact version match when available", () => {
      const factories = new Map([
        [12, () => "port-v12"],
        [13, () => "port-v13"],
        [14, () => "port-v14"],
      ]);

      const result = selector.selectPortFromFactories(factories, 13);
      expectResultOk(result);
      expect(result.value).toBe("port-v13");
    });

    it("should handle empty factory map", () => {
      const factories = new Map<number, () => string>();

      const result = selector.selectPortFromFactories(factories, 13);
      expectResultErr(result);
      expect(result.error.code).toBe("PORT_SELECTION_FAILED");
      expect(result.error.message).toContain("No compatible port found");
    });
  });

  describe("Edge Cases & Future Versions", () => {
    it("should handle future Foundry versions (v15+) by falling back to latest available port", () => {
      const factories = new Map<number, () => string>([
        [13, () => "port-v13"],
        [14, () => "port-v14"],
      ]);

      // Foundry v15 with only v13 and v14 ports available
      const result = selector.selectPortFromFactories(factories, 15);

      expectResultOk(result);
      // Should select highest available port (v14)
      expect(result.value).toBe("port-v14");
    });

    it("should handle v20+ with graceful fallback", () => {
      const factories = new Map<number, () => string>([[13, () => "port-v13"]]);

      // Far future version
      const result = selector.selectPortFromFactories(factories, 20);

      expectResultOk(result);
      // Should still select v13 as highest compatible
      expect(result.value).toBe("port-v13");
    });

    it("should fail gracefully when no compatible port exists (all ports too new)", () => {
      const factories = new Map<number, () => string>([
        [14, () => "port-v14"],
        [15, () => "port-v15"],
      ]);

      // Foundry v13 with only v14+ ports available
      const result = selector.selectPortFromFactories(factories, 13);

      expectResultErr(result);
      expect(result.error.code).toBe("PORT_SELECTION_FAILED");
      expect(result.error.message).toContain("No compatible port found");
      expect(result.error.details).toEqual(
        expect.objectContaining({
          version: 13,
          availableVersions: "14, 15",
        })
      );
    });

    it("should handle empty factory registry", () => {
      const factories = new Map<number, () => string>();

      const result = selector.selectPortFromFactories(factories, 13);

      expectResultErr(result);
      expect(result.error.code).toBe("PORT_SELECTION_FAILED");
      expect(result.error.message).toContain("No compatible port found");
    });

    it("should catch errors during port instantiation", () => {
      const factories = new Map<number, () => string>([
        [
          13,
          () => {
            throw new Error("Port constructor failed");
          },
        ],
      ]);

      const result = selector.selectPortFromFactories(factories, 13);

      expectResultErr(result);
      expect(result.error.code).toBe("PORT_SELECTION_FAILED");
      expect(result.error.message).toContain("Failed to instantiate port v13");
      expect(result.error.cause).toBeInstanceOf(Error);
    });
  });

  describe("Performance Tracking", () => {
    let originalEnablePerf: boolean;
    let originalEnableDebug: boolean;

    beforeEach(() => {
      originalEnablePerf = ENV.enablePerformanceTracking;
      originalEnableDebug = ENV.enableDebugMode;
      MetricsCollector.getInstance().reset();
    });

    afterEach(() => {
      ENV.enablePerformanceTracking = originalEnablePerf;
      ENV.enableDebugMode = originalEnableDebug;
      MetricsCollector.getInstance().reset();
    });

    it("should record port selection metrics when performance tracking enabled", () => {
      ENV.enablePerformanceTracking = true;
      const factories = new Map([[13, () => "port-v13"]]);

      selector.selectPortFromFactories(factories, 13);

      const metrics = MetricsCollector.getInstance().getSnapshot();
      expect(metrics.portSelections[13]).toBe(1);
    });

    it("should record port selection failure metrics", () => {
      ENV.enablePerformanceTracking = true;
      const factories = new Map<number, () => string>([
        [
          13,
          () => {
            throw new Error("Instantiation failed");
          },
        ],
      ]);

      selector.selectPortFromFactories(factories, 13);

      const metrics = MetricsCollector.getInstance().getSnapshot();
      expect(metrics.portSelectionFailures[13]).toBe(1);
    });

    it("should NOT record metrics when performance tracking disabled", () => {
      ENV.enablePerformanceTracking = false;
      const factories = new Map([[13, () => "port-v13"]]);

      selector.selectPortFromFactories(factories, 13);

      const metrics = MetricsCollector.getInstance().getSnapshot();
      expect(metrics.portSelections[13]).toBeUndefined();
    });

    it("should log debug message when debug mode enabled", () => {
      ENV.enableDebugMode = true;
      ENV.enablePerformanceTracking = true;
      const consoleSpy = vi.spyOn(console, "debug").mockImplementation(() => {});

      const factories = new Map([[13, () => "port-v13"]]);
      selector.selectPortFromFactories(factories, 13);

      expect(consoleSpy).toHaveBeenCalled();
      const debugCall = consoleSpy.mock.calls[0]?.[0];
      expect(debugCall).toContain("Port selection completed");
      expect(debugCall).toContain("v13");

      consoleSpy.mockRestore();
    });

    it("should NOT log debug when debug mode disabled", () => {
      ENV.enableDebugMode = false;
      ENV.enablePerformanceTracking = true;
      const consoleSpy = vi.spyOn(console, "debug").mockImplementation(() => {});

      const factories = new Map([[13, () => "port-v13"]]);
      selector.selectPortFromFactories(factories, 13);

      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it("should clean up performance marks after measurement", () => {
      ENV.enablePerformanceTracking = true;
      const clearMarksSpy = vi.spyOn(performance, "clearMarks");
      const clearMeasuresSpy = vi.spyOn(performance, "clearMeasures");

      const factories = new Map([[13, () => "port-v13"]]);
      selector.selectPortFromFactories(factories, 13);

      // Should clean up marks and measures
      expect(clearMarksSpy).toHaveBeenCalled();
      expect(clearMeasuresSpy).toHaveBeenCalled();

      clearMarksSpy.mockRestore();
      clearMeasuresSpy.mockRestore();
    });
  });
});
