/**
 * Regression tests for FoundryHooksService
 * Tests edge cases with callback reuse across multiple hooks
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { FoundryHooksService } from "../FoundryHooksService";
import type { FoundryHooks } from "@/foundry/interfaces/FoundryHooks";
import { PortRegistry } from "@/foundry/versioning/portregistry";
import { PortSelector } from "@/foundry/versioning/portselector";
import { ok } from "@/utils/result";
import type { Logger } from "@/interfaces/logger";
import {
  expectResultOk,
  createMockMetricsCollector,
  createMockLogger,
  createMockEnvironmentConfig,
} from "@/test/utils/test-helpers";

describe("FoundryHooksService - Regression Tests", () => {
  let service: FoundryHooksService;
  let mockRegistry: PortRegistry<FoundryHooks>;
  let mockSelector: PortSelector;
  let mockPort: FoundryHooks;
  let mockLogger: Logger;

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
    };

    mockRegistry = new PortRegistry<FoundryHooks>();
    vi.spyOn(mockRegistry, "getFactories").mockReturnValue(new Map([[13, () => mockPort]]));

    const mockEnv = createMockEnvironmentConfig();
    mockSelector = new PortSelector(createMockMetricsCollector(mockEnv), mockLogger, mockEnv);
    vi.spyOn(mockSelector, "selectPortFromFactories").mockReturnValue(ok(mockPort));

    service = new FoundryHooksService(mockSelector, mockRegistry, mockLogger);
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
