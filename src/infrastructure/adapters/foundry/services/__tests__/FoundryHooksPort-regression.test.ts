/**
 * Regression tests for FoundryHooksPort
 * Tests edge cases with callback reuse across multiple hooks
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { FoundryHooksPort } from "@/infrastructure/adapters/foundry/services/FoundryHooksPort";
import type { FoundryHooks } from "@/infrastructure/adapters/foundry/interfaces/FoundryHooks";
import { PortRegistry } from "@/infrastructure/adapters/foundry/versioning/portregistry";
import { PortSelector } from "@/infrastructure/adapters/foundry/versioning/portselector";
import { ok } from "@/domain/utils/result";
import type { Logger } from "@/infrastructure/logging/logger.interface";
import { expectResultOk, createMockLogger } from "@/test/utils/test-helpers";
import { PortSelectionEventEmitter } from "@/infrastructure/adapters/foundry/versioning/port-selection-events";
import type { ObservabilityRegistry } from "@/infrastructure/observability/observability-registry";
import type { RetryService } from "@/infrastructure/retry/RetryService";
import type { ServiceContainer } from "@/infrastructure/di/container";
import type { InjectionToken } from "@/infrastructure/di/types/core/injectiontoken";
import { createInjectionToken } from "@/infrastructure/di/token-factory";
import type { FoundryVersionDetector } from "@/infrastructure/adapters/foundry/versioning/foundry-version-detector";
import { ok as resultOk } from "@/domain/utils/result";

describe("FoundryHooksPort - Regression Tests", () => {
  let service: FoundryHooksPort;
  let mockRegistry: PortRegistry<FoundryHooks>;
  let mockSelector: PortSelector;
  let mockPort: FoundryHooks;
  let mockLogger: Logger;
  let mockRetryService: RetryService;
  let mockContainer: ServiceContainer;
  const mockToken = createInjectionToken<FoundryHooks>("mock-port");

  beforeEach(() => {
    // Mock game object for version detection
    vi.stubGlobal("game", {
      version: "13.291",
    });

    mockLogger = createMockLogger();

    mockPort = {
      on: vi.fn().mockReturnValue(ok(1)),
      once: vi.fn().mockReturnValue(ok(1)),
      off: vi.fn().mockReturnValue(ok(undefined)),
      dispose: vi.fn(),
    };

    mockContainer = {
      resolveWithError: vi.fn((token: InjectionToken<any>) => {
        if (token === mockToken) return { ok: true, value: mockPort };
        return { ok: false, error: { message: "Token not found" } };
      }),
    } as any;

    mockRegistry = new PortRegistry<FoundryHooks>();
    vi.spyOn(mockRegistry, "getTokens").mockReturnValue(new Map([[13, mockToken]]));

    const mockVersionDetector: FoundryVersionDetector = {
      getVersion: vi.fn().mockReturnValue(resultOk(13)),
    } as any;
    const mockEventEmitter = new PortSelectionEventEmitter();
    const mockObservability: ObservabilityRegistry = {
      registerPortSelector: vi.fn(),
    } as any;
    mockSelector = new PortSelector(
      mockVersionDetector,
      mockEventEmitter,
      mockObservability,
      mockContainer
    );
    vi.spyOn(mockSelector, "selectPortFromTokens").mockReturnValue(ok(mockPort));

    // Mock RetryService - just executes fn directly without retry logic
    mockRetryService = {
      retrySync: vi.fn((fn) => fn()),
      retry: vi.fn((fn) => fn()),
    } as any;

    service = new FoundryHooksPort(mockSelector, mockRegistry, mockRetryService, mockLogger);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe("Callback Reuse Across Multiple Hooks", () => {
    it("should allow same callback registered to two different hooks and off() both successfully", () => {
      const sharedCallback = vi.fn();

      // Register same callback to two different hooks
      let hookIdCounter = 1;
      mockPort.on = vi.fn().mockImplementation(() => ok(hookIdCounter++));

      const result1 = service.on("init", sharedCallback);
      const result2 = service.on("ready", sharedCallback);

      expectResultOk(result1);
      expectResultOk(result2);
      expect(result1.value).toBe(1);
      expect(result2.value).toBe(2);

      // Mock Hooks.off for disposal verification
      const mockHooksOff = vi.fn();
      vi.stubGlobal("Hooks", { off: mockHooksOff });

      // Remove first hook registration
      mockPort.off = vi.fn().mockReturnValue(ok(undefined));
      const offResult1 = service.off("init", sharedCallback);
      expectResultOk(offResult1);

      // Remove second hook registration
      const offResult2 = service.off("ready", sharedCallback);
      expectResultOk(offResult2);

      // Verify both were removed from port
      expect(mockPort.off).toHaveBeenCalledTimes(2);
      expect(mockPort.off).toHaveBeenCalledWith("init", sharedCallback);
      expect(mockPort.off).toHaveBeenCalledWith("ready", sharedCallback);

      // Dispose should NOT try to remove already-removed hooks
      service.dispose();
      expect(mockHooksOff).not.toHaveBeenCalled();
    });

    it("should handle same callback registered three times and dispose() removes all", () => {
      const sharedCallback = vi.fn();

      // Register same callback three times to different hooks
      let hookIdCounter = 1;
      mockPort.on = vi.fn().mockImplementation(() => ok(hookIdCounter++));

      service.on("init", sharedCallback);
      service.on("ready", sharedCallback);
      service.on("renderJournalDirectory", sharedCallback);

      // Mock Hooks.off for disposal verification
      const mockHooksOff = vi.fn();
      vi.stubGlobal("Hooks", { off: mockHooksOff });

      // Dispose should remove all three registrations
      service.dispose();

      expect(mockHooksOff).toHaveBeenCalledTimes(3);
      expect(mockHooksOff).toHaveBeenCalledWith("init", sharedCallback);
      expect(mockHooksOff).toHaveBeenCalledWith("ready", sharedCallback);
      expect(mockHooksOff).toHaveBeenCalledWith("renderJournalDirectory", sharedCallback);
    });

    it("should handle partial removal: callback on hooks A+B, only A removed via off(), B remains for dispose()", () => {
      const sharedCallback = vi.fn();

      // Register same callback to two hooks
      let hookIdCounter = 1;
      mockPort.on = vi.fn().mockImplementation(() => ok(hookIdCounter++));

      service.on("init", sharedCallback);
      service.on("ready", sharedCallback);

      // Mock Hooks.off for disposal verification
      const mockHooksOff = vi.fn();
      vi.stubGlobal("Hooks", { off: mockHooksOff });

      // Remove only "init" registration
      mockPort.off = vi.fn().mockReturnValue(ok(undefined));
      const offResult = service.off("init", sharedCallback);
      expectResultOk(offResult);

      // Verify only "init" was removed
      expect(mockPort.off).toHaveBeenCalledTimes(1);
      expect(mockPort.off).toHaveBeenCalledWith("init", sharedCallback);

      // Dispose should only remove "ready" (init was already removed)
      service.dispose();

      expect(mockHooksOff).toHaveBeenCalledTimes(1);
      expect(mockHooksOff).toHaveBeenCalledWith("ready", sharedCallback);
      expect(mockHooksOff).not.toHaveBeenCalledWith("init", sharedCallback);
    });

    it("should handle off() by hookId when same callback is registered multiple times", () => {
      const sharedCallback = vi.fn();

      // Register same callback to two hooks with specific IDs
      mockPort.on = vi.fn().mockReturnValueOnce(ok(10)).mockReturnValueOnce(ok(20));

      service.on("init", sharedCallback);
      service.on("ready", sharedCallback);

      // Mock Hooks.off for disposal verification
      const mockHooksOff = vi.fn();
      vi.stubGlobal("Hooks", { off: mockHooksOff });

      // Remove by hookId (ID 10 = "init")
      mockPort.off = vi.fn().mockReturnValue(ok(undefined));
      const offResult = service.off("init", 10);
      expectResultOk(offResult);

      // Verify correct removal
      expect(mockPort.off).toHaveBeenCalledWith("init", 10);

      // Dispose should only remove "ready" (hookId 20)
      service.dispose();

      expect(mockHooksOff).toHaveBeenCalledTimes(1);
      expect(mockHooksOff).toHaveBeenCalledWith("ready", sharedCallback);
    });

    it("should handle same callback registered to same hook multiple times (edge case)", () => {
      const sharedCallback = vi.fn();

      // Register same callback to same hook twice (unusual but valid)
      let hookIdCounter = 1;
      mockPort.on = vi.fn().mockImplementation(() => ok(hookIdCounter++));

      service.on("init", sharedCallback);
      service.on("init", sharedCallback);

      // Mock Hooks.off for disposal verification
      const mockHooksOff = vi.fn();
      vi.stubGlobal("Hooks", { off: mockHooksOff });

      // Remove all "init" registrations for this callback
      mockPort.off = vi.fn().mockReturnValue(ok(undefined));
      const offResult = service.off("init", sharedCallback);
      expectResultOk(offResult);

      // Should remove both registrations from tracking
      service.dispose();

      // No hooks should remain
      expect(mockHooksOff).not.toHaveBeenCalled();
    });
  });

  describe("Mixed Callback Scenarios", () => {
    it("should handle multiple different callbacks and one reused callback", () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      const sharedCallback = vi.fn();

      let hookIdCounter = 1;
      mockPort.on = vi.fn().mockImplementation(() => ok(hookIdCounter++));

      // Register different callbacks
      service.on("init", callback1);
      service.on("ready", callback2);
      // Register shared callback to two hooks
      service.on("init", sharedCallback);
      service.on("ready", sharedCallback);

      const mockHooksOff = vi.fn();
      vi.stubGlobal("Hooks", { off: mockHooksOff });

      // Remove only sharedCallback from "init"
      mockPort.off = vi.fn().mockReturnValue(ok(undefined));
      service.off("init", sharedCallback);

      // Dispose should remove: callback1 (init), callback2 (ready), sharedCallback (ready)
      service.dispose();

      expect(mockHooksOff).toHaveBeenCalledTimes(3);
      expect(mockHooksOff).toHaveBeenCalledWith("init", callback1);
      expect(mockHooksOff).toHaveBeenCalledWith("ready", callback2);
      expect(mockHooksOff).toHaveBeenCalledWith("ready", sharedCallback);
    });
  });
});
