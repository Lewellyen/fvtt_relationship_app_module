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
import type { ServiceContainer } from "@/infrastructure/di/container";
import type { InjectionToken } from "@/infrastructure/di/types/core/injectiontoken";
import { createInjectionToken } from "@/infrastructure/di/token-factory";
import type { FoundryVersionDetector } from "@/infrastructure/adapters/foundry/versioning/foundry-version-detector";
import { ok as resultOk } from "@/domain/utils/result";
import type { IPortSelectionObservability } from "@/infrastructure/adapters/foundry/versioning/port-selection-observability.interface";
import type { IPortSelectionPerformanceTracker } from "@/infrastructure/adapters/foundry/versioning/port-selection-performance-tracker.interface";
import type { PortSelectionObserver } from "@/infrastructure/adapters/foundry/versioning/port-selection-observer";
import type { PortMatchStrategy } from "@/infrastructure/adapters/foundry/versioning/port-match-strategy.interface";
import type { MatchError } from "@/infrastructure/adapters/foundry/versioning/port-match-strategy.interface";
import { DIPortSelector } from "@/infrastructure/adapters/foundry/versioning/portselector";

vi.mock("@/infrastructure/adapters/foundry/versioning/versiondetector", () => ({
  getFoundryVersionResult: vi.fn(),
  resetVersionCache: vi.fn(),
}));

describe("PortSelector", () => {
  let selector: PortSelector;
  let capturedEvents: PortSelectionEvent[];
  let mockEventEmitter: PortSelectionEventEmitter;
  let mockObservability: IPortSelectionObservability;
  let mockPerformanceTracker: IPortSelectionPerformanceTracker;
  let mockObserver: PortSelectionObserver;
  let mockContainer: ServiceContainer;

  // Create test tokens (using ServiceType for type safety)
  const token13 = createInjectionToken<unknown>("port-v13") as any;
  const token14 = createInjectionToken<unknown>("port-v14") as any;
  const token15 = createInjectionToken<unknown>("port-v15") as any;
  const token16 = createInjectionToken<unknown>("port-v16") as any;

  beforeEach(() => {
    mockEventEmitter = new PortSelectionEventEmitter();
    mockObservability = {
      registerWithObservabilityRegistry: vi.fn(),
      setupObservability: vi.fn(),
    } as any;
    mockPerformanceTracker = {
      startTracking: vi.fn(),
      endTracking: vi.fn().mockReturnValue(0),
    } as any;
    mockObserver = {
      handleEvent: vi.fn((event: PortSelectionEvent) => {
        // Emit event via EventEmitter for test capture
        mockEventEmitter.emit(event);
      }),
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

    const mockVersionDetector: FoundryVersionDetector = {
      getVersion: vi.fn().mockReturnValue(resultOk(13)),
    } as any;
    selector = new PortSelector(
      mockVersionDetector,
      mockEventEmitter,
      mockObservability,
      mockPerformanceTracker,
      mockObserver,
      mockContainer
    );
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

      const mockVersionDetectorV14: FoundryVersionDetector = {
        getVersion: vi.fn().mockReturnValue(resultOk(14)),
      } as any;
      const selectorV14 = new PortSelector(
        mockVersionDetectorV14,
        mockEventEmitter,
        mockObservability,
        mockPerformanceTracker,
        mockObserver,
        mockContainer
      );

      const result = selectorV14.selectPortFromTokens(tokens);
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

      const getVersionSpy = vi.fn().mockReturnValue(resultOk(13));
      const mockVersionDetectorWithSpy: FoundryVersionDetector = {
        getVersion: getVersionSpy,
      } as any;
      const selectorWithSpy = new PortSelector(
        mockVersionDetectorWithSpy,
        mockEventEmitter,
        mockObservability,
        mockPerformanceTracker,
        mockObserver,
        mockContainer
      );

      const result = selectorWithSpy.selectPortFromTokens(tokens);
      expectResultOk(result);
      expect(result.value).toBe("port-v13");
      expect(getVersionSpy).toHaveBeenCalled();
      expect(mockContainer.resolveWithError).toHaveBeenCalledWith(token13);
    });

    it("should handle version detection errors", () => {
      const tokens = new Map([[13, token13]]) as any;

      const testEventEmitter = new PortSelectionEventEmitter();
      const testCapturedEvents: PortSelectionEvent[] = [];

      const mockVersionDetectorWithError: FoundryVersionDetector = {
        getVersion: vi.fn().mockReturnValue(err("Version detection failed")),
      } as any;
      const selectorWithError = new PortSelector(
        mockVersionDetectorWithError,
        testEventEmitter,
        mockObservability,
        mockPerformanceTracker,
        {
          handleEvent: vi.fn((event: PortSelectionEvent) => {
            testEventEmitter.emit(event);
          }),
        } as any,
        mockContainer
      );

      selectorWithError.onEvent((event) => testCapturedEvents.push(event));

      const result = selectorWithError.selectPortFromTokens(tokens);
      expectResultErr(result);
      expect(result.error.code).toBe("PORT_SELECTION_FAILED");
      expect(result.error.message).toContain("Could not determine Foundry version");

      // Verify event does not contain adapterName when not provided
      expect(testCapturedEvents).toHaveLength(1);
      const event = testCapturedEvents[0];
      expect(event?.type).toBe("failure");
      if (event?.type === "failure") {
        expect(event.adapterName).toBeUndefined();
      }
    });

    it("should handle version detection errors with multiple tokens (sorts availableVersions)", () => {
      const tokens = new Map([
        [15, token15],
        [13, token13],
        [14, token14],
      ]) as any;

      const mockVersionDetectorWithError: FoundryVersionDetector = {
        getVersion: vi.fn().mockReturnValue(err("Version detection failed")),
      } as any;
      const selectorWithError = new PortSelector(
        mockVersionDetectorWithError,
        mockEventEmitter,
        mockObservability,
        mockPerformanceTracker,
        mockObserver,
        mockContainer
      );

      const result = selectorWithError.selectPortFromTokens(tokens);
      expectResultErr(result);
      expect(result.error.code).toBe("PORT_SELECTION_FAILED");
      expect(result.error.message).toContain("Could not determine Foundry version");

      // Verify that observer was called with sorted availableVersions
      expect(mockObserver.handleEvent).toHaveBeenCalledTimes(1);
      const eventCall = (mockObserver.handleEvent as any).mock.calls[0][0];
      expect(eventCall.type).toBe("failure");
      expect(eventCall.availableVersions).toBe("13, 14, 15"); // Should be sorted
      // Verify adapterName is not included when not provided
      expect(eventCall.adapterName).toBeUndefined();
    });

    it("should handle version detection errors with explicit undefined adapterName", () => {
      const tokens = new Map([[13, token13]]) as any;

      const testEventEmitter = new PortSelectionEventEmitter();
      const testCapturedEvents: PortSelectionEvent[] = [];

      const mockVersionDetectorWithError: FoundryVersionDetector = {
        getVersion: vi.fn().mockReturnValue(err("Version detection failed")),
      } as any;
      const selectorWithError = new PortSelector(
        mockVersionDetectorWithError,
        testEventEmitter,
        mockObservability,
        mockPerformanceTracker,
        {
          handleEvent: vi.fn((event: PortSelectionEvent) => {
            testEventEmitter.emit(event);
          }),
        } as any,
        mockContainer
      );

      selectorWithError.onEvent((event) => testCapturedEvents.push(event));

      // Explicitly pass undefined for adapterName
      const result = selectorWithError.selectPortFromTokens(tokens, undefined, undefined);
      expectResultErr(result);

      // Verify event does not contain adapterName
      expect(testCapturedEvents).toHaveLength(1);
      const event = testCapturedEvents[0];
      expect(event?.type).toBe("failure");
      if (event?.type === "failure") {
        expect(event.adapterName).toBeUndefined();
      }
    });

    it("should handle version detection errors with adapterName provided", () => {
      const tokens = new Map([[13, token13]]) as any;

      const testEventEmitter = new PortSelectionEventEmitter();
      const testCapturedEvents: PortSelectionEvent[] = [];

      const mockVersionDetectorWithError: FoundryVersionDetector = {
        getVersion: vi.fn().mockReturnValue(err("Version detection failed")),
      } as any;
      const selectorWithError = new PortSelector(
        mockVersionDetectorWithError,
        testEventEmitter,
        mockObservability,
        mockPerformanceTracker,
        {
          handleEvent: vi.fn((event: PortSelectionEvent) => {
            testEventEmitter.emit(event);
          }),
        } as any,
        mockContainer
      );

      selectorWithError.onEvent((event) => testCapturedEvents.push(event));

      // Pass adapterName to test the true branch of the ternary operator
      const result = selectorWithError.selectPortFromTokens(tokens, undefined, "FoundryGame");
      expectResultErr(result);

      // Verify event contains adapterName
      expect(testCapturedEvents).toHaveLength(1);
      const event = testCapturedEvents[0];
      expect(event?.type).toBe("failure");
      if (event?.type === "failure") {
        expect(event.adapterName).toBe("FoundryGame");
      }
    });

    it("should select exact version match when available", () => {
      const token12 = createInjectionToken<unknown>("port-v12") as any;
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
      const token12 = createInjectionToken<unknown>("port-v12") as any;
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
      const tokens = new Map<number, InjectionToken<unknown>>() as any;

      const result = selector.selectPortFromTokens(tokens, 13);
      expectResultErr(result);
      expect(result.error.code).toBe("PORT_SELECTION_FAILED");
      expect(result.error.message).toContain("No compatible port found");
    });
  });

  describe("Edge Cases & Future Versions", () => {
    it("should handle future Foundry versions (v15+) by falling back to latest available port", () => {
      const tokens = new Map<number, InjectionToken<unknown>>([
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
      const tokens = new Map<number, InjectionToken<unknown>>([[13, token13]]) as any;

      // Far future version
      const result = selector.selectPortFromTokens(tokens, 20);

      expectResultOk(result);
      // Should still select v13 as highest compatible
      expect(result.value).toBe("port-v13");
      expect(mockContainer.resolveWithError).toHaveBeenCalledWith(token13);
    });

    it("should fail gracefully when no compatible port exists (all ports too new)", () => {
      const tokens = new Map<number, InjectionToken<unknown>>([
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
      const tokens = new Map<number, InjectionToken<unknown>>() as any;

      const result = selector.selectPortFromTokens(tokens, 13);

      expectResultErr(result);
      expect(result.error.code).toBe("PORT_SELECTION_FAILED");
      expect(result.error.message).toContain("No compatible port found");
    });

    it("should handle container resolution errors", () => {
      const tokens = new Map<number, InjectionToken<unknown>>([[13, token13]]) as any;

      (mockContainer.resolveWithError as any).mockReturnValue({
        ok: false,
        error: { message: "Failed to resolve token" },
      });

      const result = selector.selectPortFromTokens(tokens, 13);

      expectResultErr(result);
      expect(result.error.code).toBe("PORT_RESOLUTION_FAILED");
      expect(result.error.message).toContain("Failed to resolve port from container");
    });

    it("should catch errors during port resolution", () => {
      const tokens = new Map<number, InjectionToken<unknown>>([
        [13, token13],
        [14, token14],
        [15, token15],
      ]) as any;

      (mockContainer.resolveWithError as any).mockImplementation(() => {
        throw new Error("Container resolution failed");
      });

      const testEvents: PortSelectionEvent[] = [];
      selector.onEvent((event) => testEvents.push(event));

      const result = selector.selectPortFromTokens(tokens, 13);

      expectResultErr(result);
      expect(result.error.code).toBe("PORT_RESOLUTION_FAILED");
      expect(result.error.message).toContain("Failed to resolve port from container");
      expect(result.error.cause).toBeInstanceOf(Error);

      // Verify that failure event includes sorted availableVersions (covers line 237)
      expect(testEvents).toHaveLength(1);
      const event = testEvents[0];
      expect(event?.type).toBe("failure");
      if (event?.type === "failure") {
        expect(event.availableVersions).toBe("13, 14, 15");
        expect(event.adapterName).toBeUndefined(); // adapterName not provided (covers false branch of line 239)
      }
    });

    it("should catch errors during port resolution with adapterName", () => {
      const tokens = new Map<number, InjectionToken<unknown>>([
        [13, token13],
        [14, token14],
      ]) as any;

      (mockContainer.resolveWithError as any).mockImplementation(() => {
        throw new Error("Container resolution failed");
      });

      const testEvents: PortSelectionEvent[] = [];
      selector.onEvent((event) => testEvents.push(event));

      const result = selector.selectPortFromTokens(tokens, 13, "FoundryGame");

      expectResultErr(result);
      expect(result.error.code).toBe("PORT_RESOLUTION_FAILED");
      expect(result.error.message).toContain("Failed to resolve port from container");
      expect(result.error.cause).toBeInstanceOf(Error);

      // Verify that failure event includes adapterName (covers true branch of line 239)
      expect(testEvents).toHaveLength(1);
      const event = testEvents[0];
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

    it("should fallback to tokens map when error details do not contain availableVersions string", () => {
      const tokens = new Map([
        [13, token13],
        [14, token14],
      ]) as any;

      // Create a custom strategy that returns an error with invalid details structure
      const customStrategy: PortMatchStrategy<unknown> = {
        select: () => {
          return err({
            code: "PORT_SELECTION_FAILED",
            message: "No compatible port found",
            details: { version: 13 }, // Missing availableVersions or not a string
          } as MatchError);
        },
      };

      // Create a new event emitter and captured events for this test
      const testEventEmitter = new PortSelectionEventEmitter();
      const testCapturedEvents: PortSelectionEvent[] = [];

      const selectorWithCustomStrategy = new PortSelector(
        selector["versionDetector"],
        testEventEmitter,
        mockObservability,
        mockPerformanceTracker,
        {
          handleEvent: vi.fn((event: PortSelectionEvent) => {
            testEventEmitter.emit(event);
          }),
        } as any,
        mockContainer,
        customStrategy
      );

      selectorWithCustomStrategy.onEvent((event) => testCapturedEvents.push(event));

      const result = selectorWithCustomStrategy.selectPortFromTokens(tokens, 13);

      expectResultErr(result);
      expect(testCapturedEvents).toHaveLength(1);
      const event = testCapturedEvents[0];
      expect(event?.type).toBe("failure");
      if (event?.type === "failure") {
        // Should fallback to sorted tokens from the map
        expect(event.availableVersions).toBe("13, 14");
      }
    });
  });

  describe("DIPortSelector", () => {
    it("should extend PortSelector and use default GreedyPortMatchStrategy", () => {
      const diSelector = new DIPortSelector(
        selector["versionDetector"],
        mockEventEmitter,
        mockObservability,
        mockPerformanceTracker,
        mockObserver,
        mockContainer
      );

      expect(diSelector).toBeInstanceOf(PortSelector);
      expect(diSelector).toBeInstanceOf(DIPortSelector);

      // Test that it works with default strategy
      const tokens = new Map([[13, token13]]) as any;
      const result = diSelector.selectPortFromTokens(tokens, 13);

      expectResultOk(result);
      expect(result.value).toBe("port-v13");
    });
  });
});
