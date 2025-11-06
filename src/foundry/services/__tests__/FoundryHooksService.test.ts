import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { FoundryHooksService } from "../FoundryHooksService";
import type { FoundryHooks } from "@/foundry/interfaces/FoundryHooks";
import { PortRegistry } from "@/foundry/versioning/portregistry";
import { PortSelector } from "@/foundry/versioning/portselector";
import { ok, err } from "@/utils/result";
import {
  expectResultOk,
  expectResultErr,
  createMockMetricsCollector,
} from "@/test/utils/test-helpers";

describe("FoundryHooksService", () => {
  let service: FoundryHooksService;
  let mockRegistry: PortRegistry<FoundryHooks>;
  let mockSelector: PortSelector;
  let mockPort: FoundryHooks;

  beforeEach(() => {
    // Mock game object for version detection
    vi.stubGlobal("game", {
      version: "13.291",
    });

    mockPort = {
      on: vi.fn().mockReturnValue(ok(1)),
      once: vi.fn().mockReturnValue(ok(1)),
      off: vi.fn().mockReturnValue(ok(undefined)),
    };

    mockRegistry = new PortRegistry<FoundryHooks>();
    vi.spyOn(mockRegistry, "getFactories").mockReturnValue(new Map([[13, () => mockPort]]));

    mockSelector = new PortSelector(createMockMetricsCollector());
    vi.spyOn(mockSelector, "selectPortFromFactories").mockReturnValue(ok(mockPort));

    service = new FoundryHooksService(mockSelector, mockRegistry);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe("Lazy Port Resolution", () => {
    it("should resolve port on first call using PortSelector", () => {
      const callback = vi.fn();
      const result = service.on("init", callback);
      expectResultOk(result);
    });

    it("should cache resolved port", () => {
      const callback = vi.fn();
      const firstCall = service.on("init", callback);
      const secondCall = service.on("ready", callback);

      expectResultOk(firstCall);
      expectResultOk(secondCall);
    });

    it("should propagate port selection errors", () => {
      const failingSelector = new PortSelector(createMockMetricsCollector());
      const mockError = {
        code: "PORT_SELECTION_FAILED" as const,
        message: "Port selection failed",
      };
      vi.spyOn(failingSelector, "selectPortFromFactories").mockReturnValue(err(mockError));
      const failingService = new FoundryHooksService(failingSelector, mockRegistry);

      const callback = vi.fn();
      const result = failingService.on("init", callback);

      expectResultErr(result);
      expect(result.error.message).toContain("Port selection failed");
    });
  });

  describe("on delegation", () => {
    it("should delegate to port", () => {
      const callback = vi.fn();
      mockPort.on = vi.fn().mockReturnValue(ok(undefined));

      const result = service.on("init", callback);

      expectResultOk(result);
      expect(mockPort.on).toHaveBeenCalledWith("init", callback);
    });

    it("should handle port errors", () => {
      const callback = vi.fn();
      const mockError = {
        code: "OPERATION_FAILED" as const,
        message: "Hook registration failed",
      };
      mockPort.on = vi.fn().mockReturnValue(err(mockError));

      const result = service.on("init", callback);

      expectResultErr(result);
      expect(result.error.message).toContain("Hook registration failed");
    });
  });

  describe("once delegation", () => {
    it("should delegate to port", () => {
      const callback = vi.fn();
      mockPort.once = vi.fn().mockReturnValue(ok(2));

      const result = service.once("renderJournalDirectory", callback);

      expectResultOk(result);
      expect(mockPort.once).toHaveBeenCalledWith("renderJournalDirectory", callback);
      expect(result.value).toBe(2);
    });

    it("should NOT track once-hooks (auto-cleanup by Foundry)", () => {
      const callback = vi.fn();
      mockPort.once = vi.fn().mockReturnValue(ok(42));

      const hookId = service.once("testHook", callback);
      expectResultOk(hookId);
      expect(hookId.value).toBe(42);

      // Mock global Hooks for disposal
      const mockHooksOff = vi.fn();
      vi.stubGlobal("Hooks", { off: mockHooksOff });

      // Dispose should NOT try to remove once-hooks (they auto-remove)
      service.dispose();

      // once-hook should NOT be in the off() calls
      expect(mockHooksOff).not.toHaveBeenCalledWith("testHook", expect.anything());
    });
  });

  describe("off delegation", () => {
    it("should delegate to port", () => {
      const callback = vi.fn();
      mockPort.off = vi.fn().mockReturnValue(ok(undefined));

      const result = service.off("init", callback);

      expectResultOk(result);
      expect(mockPort.off).toHaveBeenCalledWith("init", callback);
    });

    it("should remove hook from tracking when off() is called with hookId", () => {
      const callback = vi.fn();

      // Register hook
      mockPort.on = vi.fn().mockReturnValue(ok(1));
      service.on("init", callback);

      // Remove hook by hookId
      mockPort.off = vi.fn().mockReturnValue(ok(undefined));
      const result = service.off("init", 1);

      expectResultOk(result);
      expect(mockPort.off).toHaveBeenCalledWith("init", 1);

      // Dispose should not try to remove the already-removed hook
      const mockHooksOff = vi.fn();
      vi.stubGlobal("Hooks", { off: mockHooksOff });
      service.dispose();

      // The hook should have been removed from tracking
      expect(mockHooksOff).not.toHaveBeenCalledWith("init", callback);
    });

    it("should remove hook from tracking when off() is called with callback function", () => {
      const callback = vi.fn();

      // Register hook
      mockPort.on = vi.fn().mockReturnValue(ok(42));
      service.on("init", callback);

      // Remove hook by callback (not hookId)
      mockPort.off = vi.fn().mockReturnValue(ok(undefined));
      const result = service.off("init", callback);

      expectResultOk(result);
      expect(mockPort.off).toHaveBeenCalledWith("init", callback);

      // Dispose should not try to remove the already-removed hook
      const mockHooksOff = vi.fn();
      vi.stubGlobal("Hooks", { off: mockHooksOff });
      service.dispose();

      // The hook should have been removed from tracking (no duplicate deregistration)
      expect(mockHooksOff).not.toHaveBeenCalledWith("init", callback);
    });

    it("should cleanup both registeredHooks and callbackToIdMap when off() is called with callback", () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      // Register multiple hooks
      mockPort.on = vi.fn().mockReturnValueOnce(ok(1)).mockReturnValueOnce(ok(2));
      service.on("init", callback1);
      service.on("ready", callback2);

      // Remove callback1 by callback (not hookId)
      mockPort.off = vi.fn().mockReturnValue(ok(undefined));
      const result = service.off("init", callback1);

      expectResultOk(result);

      // Dispose should only try to remove callback2 (callback1 was already removed)
      const mockHooksOff = vi.fn();
      vi.stubGlobal("Hooks", { off: mockHooksOff });
      service.dispose();

      expect(mockHooksOff).toHaveBeenCalledTimes(1);
      expect(mockHooksOff).toHaveBeenCalledWith("ready", callback2);
      expect(mockHooksOff).not.toHaveBeenCalledWith("init", callback1);
    });

    it("should handle off() with callback that was never registered", () => {
      const unknownCallback = vi.fn();

      // Try to remove a callback that was never registered
      mockPort.off = vi.fn().mockReturnValue(ok(undefined));
      const result = service.off("init", unknownCallback);

      // Should succeed (port handled it) but nothing to clean up from tracking
      expectResultOk(result);
    });
  });

  describe("Version Detection Failures", () => {
    it("should handle port selector errors", () => {
      const failingSelector = new PortSelector(createMockMetricsCollector());
      const mockError = {
        code: "PORT_SELECTION_FAILED" as const,
        message: "No compatible port found",
      };
      vi.spyOn(failingSelector, "selectPortFromFactories").mockReturnValue(err(mockError));
      const failingService = new FoundryHooksService(failingSelector, mockRegistry);

      const callback = vi.fn();
      const result = failingService.on("init", callback);

      expectResultErr(result);
      expect(result.error.message).toContain("No compatible port");
    });
  });

  describe("dispose error handling", () => {
    it("should handle Hooks.off() errors gracefully during disposal", () => {
      const callback = vi.fn();
      mockPort.on = vi.fn().mockReturnValue(ok(1));
      service.on("init", callback);

      // Mock Hooks.off to throw
      const mockHooksOff = vi.fn().mockImplementation(() => {
        throw new Error("Hooks.off failed");
      });
      vi.stubGlobal("Hooks", { off: mockHooksOff });

      // Should not throw - errors are caught and logged
      expect(() => service.dispose()).not.toThrow();
      expect(mockHooksOff).toHaveBeenCalled();
    });

    it("should handle undefined Hooks API during disposal", () => {
      const callback = vi.fn();
      mockPort.on = vi.fn().mockReturnValue(ok(1));
      service.on("init", callback);

      // Simulate Hooks not available
      vi.stubGlobal("Hooks", undefined);

      // Should not throw
      expect(() => service.dispose()).not.toThrow();
    });

    it("should clear all registered hooks during disposal", () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      const callback3 = vi.fn();

      mockPort.on = vi.fn().mockReturnValue(ok(1));
      service.on("init", callback1);
      service.on("ready", callback2);
      service.on("renderJournalDirectory", callback3);

      const mockHooksOff = vi.fn();
      vi.stubGlobal("Hooks", { off: mockHooksOff });

      service.dispose();

      // Should try to unregister all 3 hooks
      expect(mockHooksOff).toHaveBeenCalledTimes(3);
      expect(mockHooksOff).toHaveBeenCalledWith("init", callback1);
      expect(mockHooksOff).toHaveBeenCalledWith("ready", callback2);
      expect(mockHooksOff).toHaveBeenCalledWith("renderJournalDirectory", callback3);
    });
  });

  describe("Port Error Branches", () => {
    it("should handle port selection failure in once", () => {
      const failingSelector = new PortSelector(createMockMetricsCollector());
      const mockError = {
        code: "PORT_SELECTION_FAILED" as const,
        message: "Port selection failed",
      };
      vi.spyOn(failingSelector, "selectPortFromFactories").mockReturnValue(err(mockError));
      const failingService = new FoundryHooksService(failingSelector, mockRegistry);

      const callback = vi.fn();
      const result = failingService.once("init", callback);

      expectResultErr(result);
      expect(result.error.message).toContain("Port selection failed");
    });

    it("should handle port selection failure in off", () => {
      const failingSelector = new PortSelector(createMockMetricsCollector());
      const mockError = {
        code: "PORT_SELECTION_FAILED" as const,
        message: "Port selection failed",
      };
      vi.spyOn(failingSelector, "selectPortFromFactories").mockReturnValue(err(mockError));
      const failingService = new FoundryHooksService(failingSelector, mockRegistry);

      const result = failingService.off("init", 1);

      expectResultErr(result);
      expect(result.error.message).toContain("Port selection failed");
    });
  });
});
