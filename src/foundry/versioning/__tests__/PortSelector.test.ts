/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { PortSelector } from "../portselector";
import { getFoundryVersionResult, resetVersionCache } from "../versiondetector";
import { expectResultOk, expectResultErr } from "@/test/utils/test-helpers";
import { ok, err } from "@/utils/functional/result";
import type { PortSelectionEvent } from "../port-selection-events";
import { PortSelectionEventEmitter } from "../port-selection-events";
import type { ObservabilityRegistry } from "@/observability/observability-registry";

vi.mock("../versiondetector", () => ({
  getFoundryVersionResult: vi.fn(),
  resetVersionCache: vi.fn(),
}));

describe("PortSelector", () => {
  let selector: PortSelector;
  let capturedEvents: PortSelectionEvent[];
  let mockEventEmitter: PortSelectionEventEmitter;
  let mockObservability: ObservabilityRegistry;

  beforeEach(() => {
    mockEventEmitter = new PortSelectionEventEmitter();
    mockObservability = {
      registerPortSelector: vi.fn(),
    } as any;

    selector = new PortSelector(mockEventEmitter, mockObservability);
    capturedEvents = [];
    // Subscribe to events for testing
    selector.onEvent((event) => capturedEvents.push(event));
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

    it("should skip ports with version less than or equal to selected version", () => {
      // This covers line 150: if (portVersion > selectedVersion) - the case where portVersion <= selectedVersion (false branch)
      // When iterating through ports, if we already selected v13, then v12 should be skipped (12 < 13)
      // This tests the false branch of the condition: portVersion > selectedVersion is false when portVersion <= selectedVersion
      const factories = new Map([
        [13, () => "port-v13"],
        [12, () => "port-v12"], // Lower version - should be skipped because 12 < 13 (line 150: false branch)
      ]);

      // When Foundry version is 14, v13 is selected first (13 > -1), then v12 is encountered
      // Since 12 < 13 (current selectedVersion), the condition portVersion > selectedVersion is false
      // This covers the false branch of line 150
      const result = selector.selectPortFromFactories(factories, 14);
      expectResultOk(result);
      expect(result.value).toBe("port-v13");
      // v13 is selected, v12 should be skipped (line 150: false branch - portVersion <= selectedVersion)
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

  describe("Event Emission", () => {
    it("should emit success event with correct data", () => {
      const factories = new Map([[13, () => "port-v13"]]);
      selector.selectPortFromFactories(factories, 13);

      expect(capturedEvents).toHaveLength(1);
      const event = capturedEvents[0];
      expect(event?.type).toBe("success");
      if (event?.type === "success") {
        expect(event.selectedVersion).toBe(13);
        expect(event.foundryVersion).toBe(13);
        expect(event.durationMs).toBeGreaterThanOrEqual(0);
      }
    });

    it("should emit success event with adapter name when provided", () => {
      const factories = new Map([[13, () => "port-v13"]]);
      selector.selectPortFromFactories(factories, 13, "FoundryHooks");

      expect(capturedEvents).toHaveLength(1);
      const event = capturedEvents[0];
      expect(event?.type).toBe("success");
      if (event?.type === "success") {
        expect(event.adapterName).toBe("FoundryHooks");
      }
    });

    it("should emit failure event when no compatible port", () => {
      const factories = new Map([[15, () => "port-v15"]]);
      selector.selectPortFromFactories(factories, 13);

      expect(capturedEvents).toHaveLength(1);
      const event = capturedEvents[0];
      expect(event?.type).toBe("failure");
      if (event?.type === "failure") {
        expect(event.foundryVersion).toBe(13);
        expect(event.availableVersions).toBe("15");
      }
    });

    it("should emit failure event with sorted availableVersions when multiple versions available", () => {
      // This covers line 207: availableVersions: Array.from(factories.keys()).sort((a, b) => a - b).join(", ")
      const factories = new Map([
        [15, () => "port-v15"],
        [14, () => "port-v14"],
        [16, () => "port-v16"],
      ]);
      selector.selectPortFromFactories(factories, 13);

      expect(capturedEvents).toHaveLength(1);
      const event = capturedEvents[0];
      expect(event?.type).toBe("failure");
      if (event?.type === "failure") {
        expect(event.foundryVersion).toBe(13);
        // Should be sorted: "14, 15, 16" (line 207)
        expect(event.availableVersions).toBe("14, 15, 16");
      }
    });

    it("should emit failure event with sorted availableVersions when port instantiation fails", () => {
      // This covers line 207: availableVersions when instantiation fails (in catch block)
      const factories = new Map([
        [
          13,
          () => {
            throw new Error("Port constructor failed");
          },
        ],
        [14, () => "port-v14"],
        [15, () => "port-v15"],
      ]);
      selector.selectPortFromFactories(factories, 13);

      expect(capturedEvents).toHaveLength(1);
      const event = capturedEvents[0];
      expect(event?.type).toBe("failure");
      if (event?.type === "failure") {
        expect(event.foundryVersion).toBe(13);
        // Should be sorted: "13, 14, 15" (line 207) - includes all versions, not just compatible ones
        expect(event.availableVersions).toBe("13, 14, 15");
      }
    });

    it("should emit failure event with adapter name when provided", () => {
      const factories = new Map([[15, () => "port-v15"]]);
      selector.selectPortFromFactories(factories, 13, "FoundryHooks");

      expect(capturedEvents).toHaveLength(1);
      const event = capturedEvents[0];
      expect(event?.type).toBe("failure");
      if (event?.type === "failure") {
        expect(event.adapterName).toBe("FoundryHooks");
      }
    });

    it("should emit failure event when instantiation fails", () => {
      const factories = new Map([
        [
          13,
          () => {
            throw new Error("Instantiation error");
          },
        ],
      ]);
      selector.selectPortFromFactories(factories, 13);

      expect(capturedEvents).toHaveLength(1);
      const event = capturedEvents[0];
      expect(event?.type).toBe("failure");
    });

    it("should emit failure event with adapter name when instantiation fails", () => {
      const factories = new Map<number, () => string>([
        [
          13,
          () => {
            throw new Error("Instantiation error");
          },
        ],
      ]);

      selector.selectPortFromFactories(factories, 13, "FoundryGame");

      expect(capturedEvents).toHaveLength(1);
      const event = capturedEvents[0];
      expect(event?.type).toBe("failure");
      if (event?.type === "failure") {
        expect(event.adapterName).toBe("FoundryGame");
      }
    });
  });
});
