/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { PortSelector } from "@/infrastructure/adapters/foundry/versioning/portselector";
import {
  getFoundryVersionResult,
  resetVersionCache,
} from "@/infrastructure/adapters/foundry/versioning/versiondetector";
import { expectResultOk, expectResultErr } from "@/test/utils/test-helpers";
import { ok, err } from "@/domain/utils/result";
import type { PortSelectionEvent } from "@/infrastructure/adapters/foundry/versioning/port-selection-events";
import { PortSelectionEventEmitter } from "@/infrastructure/adapters/foundry/versioning/port-selection-events";
import type { ObservabilityRegistry } from "@/infrastructure/observability/observability-registry";
import type { ServiceContainer } from "@/infrastructure/di/container";
import type { InjectionToken } from "@/infrastructure/di/types/core/injectiontoken";
import type { ServiceType } from "@/infrastructure/shared/tokens";
import { createInjectionToken } from "@/infrastructure/di/tokenutilities";

vi.mock("@/infrastructure/adapters/foundry/versioning/versiondetector", () => ({
  getFoundryVersionResult: vi.fn(),
  resetVersionCache: vi.fn(),
}));

describe("PortSelector", () => {
  let selector: PortSelector;
  let capturedEvents: PortSelectionEvent[];
  let mockEventEmitter: PortSelectionEventEmitter;
  let mockObservability: ObservabilityRegistry;
  let mockContainer: ServiceContainer;

  // Create test tokens (using ServiceType for type safety)
  const token13 = createInjectionToken<ServiceType>("port-v13") as any;
  const token14 = createInjectionToken<ServiceType>("port-v14") as any;
  const token15 = createInjectionToken<ServiceType>("port-v15") as any;
  const token16 = createInjectionToken<ServiceType>("port-v16") as any;

  beforeEach(() => {
    mockEventEmitter = new PortSelectionEventEmitter();
    mockObservability = {
      registerPortSelector: vi.fn(),
    } as any;

    // Create mock container
    mockContainer = {
      resolveWithError: vi.fn((token: InjectionToken<any>) => {
        if (token === token13) return { ok: true, value: "port-v13" };
        if (token === token14) return { ok: true, value: "port-v14" };
        if (token === token15) return { ok: true, value: "port-v15" };
        if (token === token16) return { ok: true, value: "port-v16" };
        return { ok: false, error: { message: "Token not found" } };
      }),
    } as any;

    selector = new PortSelector(mockEventEmitter, mockObservability, mockContainer);
    capturedEvents = [];
    // Subscribe to events for testing
    selector.onEvent((event) => capturedEvents.push(event));
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    resetVersionCache(); // Clear version cache for test isolation
  });

  describe("selectPortFromTokens", () => {
    it("should select highest compatible port version", () => {
      const tokens = new Map([
        [13, token13],
        [14, token14],
        [15, token15],
      ]) as any;

      vi.mocked(getFoundryVersionResult).mockReturnValue(ok(14));

      const result = selector.selectPortFromTokens(tokens);
      expectResultOk(result);
      expect(result.value).toBe("port-v14");
      expect(mockContainer.resolveWithError).toHaveBeenCalledWith(token14);
    });

    it("should fallback to lower version when exact match not available", () => {
      const tokens = new Map([
        [13, token13],
        [15, token15],
      ]) as any;

      vi.mocked(getFoundryVersionResult).mockReturnValue(ok(14));

      const result = selector.selectPortFromTokens(tokens);
      expectResultOk(result);
      expect(result.value).toBe("port-v13");
      expect(mockContainer.resolveWithError).toHaveBeenCalledWith(token13);
    });

    it("should ignore ports with version higher than Foundry version", () => {
      const tokens = new Map([
        [13, token13],
        [15, token15],
      ]) as any;

      vi.mocked(getFoundryVersionResult).mockReturnValue(ok(13));

      const result = selector.selectPortFromTokens(tokens);
      expectResultOk(result);
      expect(result.value).toBe("port-v13");
      expect(mockContainer.resolveWithError).toHaveBeenCalledWith(token13);
    });

    it("should fail when no compatible port available", () => {
      const tokens = new Map([
        [14, token14],
        [15, token15],
      ]) as any;

      vi.mocked(getFoundryVersionResult).mockReturnValue(ok(13));

      const result = selector.selectPortFromTokens(tokens);
      expectResultErr(result);
      expect(result.error.code).toBe("PORT_SELECTION_FAILED");
      expect(result.error.message).toContain("No compatible port found");
    });

    it("should use provided foundryVersion parameter", () => {
      const tokens = new Map([
        [13, token13],
        [14, token14],
      ]);

      const result = selector.selectPortFromTokens(tokens, 14);
      expectResultOk(result);
      expect(result.value).toBe("port-v14");
      expect(getFoundryVersionResult).not.toHaveBeenCalled();
      expect(mockContainer.resolveWithError).toHaveBeenCalledWith(token14);
    });

    it("should detect Foundry version when not provided", () => {
      const tokens = new Map([[13, token13]]) as any;

      vi.mocked(getFoundryVersionResult).mockReturnValue(ok(13));

      const result = selector.selectPortFromTokens(tokens);
      expectResultOk(result);
      expect(result.value).toBe("port-v13");
      expect(getFoundryVersionResult).toHaveBeenCalled();
      expect(mockContainer.resolveWithError).toHaveBeenCalledWith(token13);
    });

    it("should handle version detection errors", () => {
      const tokens = new Map([[13, token13]]) as any;

      vi.mocked(getFoundryVersionResult).mockReturnValue(err("Version detection failed"));

      const result = selector.selectPortFromTokens(tokens);
      expectResultErr(result);
      expect(result.error.code).toBe("PORT_SELECTION_FAILED");
      expect(result.error.message).toContain("Could not determine Foundry version");
    });

    it("should select exact version match when available", () => {
      const token12 = createInjectionToken<ServiceType>("port-v12") as any;
      const tokens = new Map([
        [12, token12],
        [13, token13],
        [14, token14],
      ]) as any;

      (mockContainer.resolveWithError as any).mockImplementation((token: InjectionToken<any>) => {
        if (token === token12) return { ok: true, value: "port-v12" };
        if (token === token13) return { ok: true, value: "port-v13" };
        if (token === token14) return { ok: true, value: "port-v14" };
        return { ok: false, error: { message: "Token not found" } };
      });

      const result = selector.selectPortFromTokens(tokens, 13);
      expectResultOk(result);
      expect(result.value).toBe("port-v13");
      expect(mockContainer.resolveWithError).toHaveBeenCalledWith(token13);
    });

    it("should skip ports with version less than or equal to selected version", () => {
      const token12 = createInjectionToken<ServiceType>("port-v12") as any;
      const tokens = new Map([
        [13, token13],
        [12, token12], // Lower version - should be skipped because 12 < 13
      ]) as any;

      (mockContainer.resolveWithError as any).mockImplementation((token: InjectionToken<any>) => {
        if (token === token12) return { ok: true, value: "port-v12" };
        if (token === token13) return { ok: true, value: "port-v13" };
        return { ok: false, error: { message: "Token not found" } };
      });

      const result = selector.selectPortFromTokens(tokens, 14);
      expectResultOk(result);
      expect(result.value).toBe("port-v13");
      expect(mockContainer.resolveWithError).toHaveBeenCalledWith(token13);
      expect(mockContainer.resolveWithError).not.toHaveBeenCalledWith(token12);
    });

    it("should handle empty token map", () => {
      const tokens = new Map<number, InjectionToken<ServiceType>>() as any;

      const result = selector.selectPortFromTokens(tokens, 13);
      expectResultErr(result);
      expect(result.error.code).toBe("PORT_SELECTION_FAILED");
      expect(result.error.message).toContain("No compatible port found");
    });
  });

  describe("Edge Cases & Future Versions", () => {
    it("should handle future Foundry versions (v15+) by falling back to latest available port", () => {
      const tokens = new Map<number, InjectionToken<ServiceType>>([
        [13, token13],
        [14, token14],
      ]) as any;

      // Foundry v15 with only v13 and v14 ports available
      const result = selector.selectPortFromTokens(tokens, 15);

      expectResultOk(result);
      // Should select highest available port (v14)
      expect(result.value).toBe("port-v14");
      expect(mockContainer.resolveWithError).toHaveBeenCalledWith(token14);
    });

    it("should handle v20+ with graceful fallback", () => {
      const tokens = new Map<number, InjectionToken<ServiceType>>([[13, token13]]) as any;

      // Far future version
      const result = selector.selectPortFromTokens(tokens, 20);

      expectResultOk(result);
      // Should still select v13 as highest compatible
      expect(result.value).toBe("port-v13");
      expect(mockContainer.resolveWithError).toHaveBeenCalledWith(token13);
    });

    it("should fail gracefully when no compatible port exists (all ports too new)", () => {
      const tokens = new Map<number, InjectionToken<ServiceType>>([
        [14, token14],
        [15, token15],
      ]) as any;

      // Foundry v13 with only v14+ ports available
      const result = selector.selectPortFromTokens(tokens, 13);

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

    it("should handle empty token registry", () => {
      const tokens = new Map<number, InjectionToken<ServiceType>>() as any;

      const result = selector.selectPortFromTokens(tokens, 13);

      expectResultErr(result);
      expect(result.error.code).toBe("PORT_SELECTION_FAILED");
      expect(result.error.message).toContain("No compatible port found");
    });

    it("should handle container resolution errors", () => {
      const tokens = new Map<number, InjectionToken<ServiceType>>([[13, token13]]) as any;

      (mockContainer.resolveWithError as any).mockReturnValue({
        ok: false,
        error: { message: "Failed to resolve token" },
      });

      const result = selector.selectPortFromTokens(tokens, 13);

      expectResultErr(result);
      expect(result.error.code).toBe("PORT_SELECTION_FAILED");
      expect(result.error.message).toContain("Failed to resolve port v13 from container");
    });

    it("should catch errors during port resolution", () => {
      const tokens = new Map<number, InjectionToken<ServiceType>>([
        [13, token13],
        [14, token14],
        [15, token15],
      ]) as any;

      (mockContainer.resolveWithError as any).mockImplementation(() => {
        throw new Error("Container resolution failed");
      });

      const result = selector.selectPortFromTokens(tokens, 13);

      expectResultErr(result);
      expect(result.error.code).toBe("PORT_SELECTION_FAILED");
      expect(result.error.message).toContain("Failed to resolve port v13 from container");
      expect(result.error.cause).toBeInstanceOf(Error);

      // Verify that failure event includes sorted availableVersions (covers line 237)
      expect(capturedEvents).toHaveLength(1);
      const event = capturedEvents[0];
      expect(event?.type).toBe("failure");
      if (event?.type === "failure") {
        expect(event.availableVersions).toBe("13, 14, 15");
        expect(event.adapterName).toBeUndefined(); // adapterName not provided (covers false branch of line 239)
      }
    });

    it("should catch errors during port resolution with adapterName", () => {
      const tokens = new Map<number, InjectionToken<ServiceType>>([
        [13, token13],
        [14, token14],
      ]) as any;

      (mockContainer.resolveWithError as any).mockImplementation(() => {
        throw new Error("Container resolution failed");
      });

      const result = selector.selectPortFromTokens(tokens, 13, "FoundryGame");

      expectResultErr(result);
      expect(result.error.code).toBe("PORT_SELECTION_FAILED");
      expect(result.error.message).toContain("Failed to resolve port v13 from container");
      expect(result.error.cause).toBeInstanceOf(Error);

      // Verify that failure event includes adapterName (covers true branch of line 239)
      expect(capturedEvents).toHaveLength(1);
      const event = capturedEvents[0];
      expect(event?.type).toBe("failure");
      if (event?.type === "failure") {
        expect(event.adapterName).toBe("FoundryGame");
        expect(event.availableVersions).toBe("13, 14");
      }
    });
  });

  describe("Event Emission", () => {
    it("should emit success event with correct data", () => {
      const tokens = new Map([[13, token13]]) as any;
      selector.selectPortFromTokens(tokens, 13);

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
      const tokens = new Map([[13, token13]]) as any;
      selector.selectPortFromTokens(tokens, 13, "FoundryHooks");

      expect(capturedEvents).toHaveLength(1);
      const event = capturedEvents[0];
      expect(event?.type).toBe("success");
      if (event?.type === "success") {
        expect(event.adapterName).toBe("FoundryHooks");
      }
    });

    it("should emit failure event when no compatible port", () => {
      const tokens = new Map([[15, token15]]) as any;
      selector.selectPortFromTokens(tokens, 13);

      expect(capturedEvents).toHaveLength(1);
      const event = capturedEvents[0];
      expect(event?.type).toBe("failure");
      if (event?.type === "failure") {
        expect(event.foundryVersion).toBe(13);
        expect(event.availableVersions).toBe("15");
      }
    });

    it("should emit failure event with sorted availableVersions when multiple versions available", () => {
      const tokens = new Map([
        [15, token15],
        [14, token14],
        [16, token16],
      ]) as any;
      selector.selectPortFromTokens(tokens, 13);

      expect(capturedEvents).toHaveLength(1);
      const event = capturedEvents[0];
      expect(event?.type).toBe("failure");
      if (event?.type === "failure") {
        expect(event.foundryVersion).toBe(13);
        // Should be sorted: "14, 15, 16"
        expect(event.availableVersions).toBe("14, 15, 16");
      }
    });

    it("should emit failure event with sorted availableVersions when port resolution fails", () => {
      const tokens = new Map([
        [13, token13],
        [14, token14],
        [15, token15],
      ]);

      (mockContainer.resolveWithError as any).mockReturnValue({
        ok: false,
        error: { message: "Resolution failed" },
      });

      selector.selectPortFromTokens(tokens, 13);

      expect(capturedEvents).toHaveLength(1);
      const event = capturedEvents[0];
      expect(event?.type).toBe("failure");
      if (event?.type === "failure") {
        expect(event.foundryVersion).toBe(13);
        // Should be sorted: "13, 14, 15" - includes all versions, not just compatible ones
        expect(event.availableVersions).toBe("13, 14, 15");
      }
    });

    it("should emit failure event with adapter name when provided", () => {
      const tokens = new Map([[15, token15]]) as any;
      selector.selectPortFromTokens(tokens, 13, "FoundryHooks");

      expect(capturedEvents).toHaveLength(1);
      const event = capturedEvents[0];
      expect(event?.type).toBe("failure");
      if (event?.type === "failure") {
        expect(event.adapterName).toBe("FoundryHooks");
      }
    });

    it("should emit failure event when resolution fails", () => {
      const tokens = new Map([[13, token13]]) as any;

      (mockContainer.resolveWithError as any).mockReturnValue({
        ok: false,
        error: { message: "Resolution error" },
      });

      selector.selectPortFromTokens(tokens, 13);

      expect(capturedEvents).toHaveLength(1);
      const event = capturedEvents[0];
      expect(event?.type).toBe("failure");
    });

    it("should emit failure event with adapter name when resolution fails", () => {
      const tokens = new Map([[13, token13]]) as any;

      (mockContainer.resolveWithError as any).mockReturnValue({
        ok: false,
        error: { message: "Resolution error" },
      });

      selector.selectPortFromTokens(tokens, 13, "FoundryGame");

      expect(capturedEvents).toHaveLength(1);
      const event = capturedEvents[0];
      expect(event?.type).toBe("failure");
      if (event?.type === "failure") {
        expect(event.adapterName).toBe("FoundryGame");
      }
    });
  });
});
