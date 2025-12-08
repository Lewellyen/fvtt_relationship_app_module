/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { FoundryHooksPort } from "@/infrastructure/adapters/foundry/services/FoundryHooksPort";
import type { FoundryHooks } from "@/infrastructure/adapters/foundry/interfaces/FoundryHooks";
import { PortRegistry } from "@/infrastructure/adapters/foundry/versioning/portregistry";
import { PortSelector } from "@/infrastructure/adapters/foundry/versioning/portselector";
import { ok, err } from "@/domain/utils/result";
import type { Logger } from "@/infrastructure/logging/logger.interface";
import { expectResultOk, expectResultErr, createMockLogger } from "@/test/utils/test-helpers";
import { PortSelectionEventEmitter } from "@/infrastructure/adapters/foundry/versioning/port-selection-events";
import type { ObservabilityRegistry } from "@/infrastructure/observability/observability-registry";
import type { RetryService } from "@/infrastructure/retry/RetryService";
import type { ServiceContainer } from "@/infrastructure/di/container";
import type { InjectionToken } from "@/infrastructure/di/types/core/injectiontoken";
import { createInjectionToken } from "@/infrastructure/di/token-factory";
import type { FoundryVersionDetector } from "@/infrastructure/adapters/foundry/versioning/foundry-version-detector";
import { ok as resultOk } from "@/domain/utils/result";

describe("FoundryHooksPort", () => {
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
      const mockEventEmitter = new PortSelectionEventEmitter();
      const mockObservability: ObservabilityRegistry = {
        registerPortSelector: vi.fn(),
      } as any;
      const mockVersionDetector: FoundryVersionDetector = {
        getVersion: vi.fn().mockReturnValue(resultOk(13)),
      } as any;
      const failingSelector = new PortSelector(
        mockVersionDetector,
        mockEventEmitter,
        mockObservability,
        mockContainer
      );
      const mockError = {
        code: "PORT_SELECTION_FAILED" as const,
        message: "Port selection failed",
      };
      vi.spyOn(failingSelector, "selectPortFromTokens").mockReturnValue(err(mockError));
      const failingService = new FoundryHooksPort(
        failingSelector,
        mockRegistry,
        mockRetryService,
        mockLogger
      );

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

    it("should handle off() with hookId when hooks map doesn't exist (coverage for hooks branch)", () => {
      // Register a hook first
      const callback = vi.fn();
      mockPort.on = vi.fn().mockReturnValue(ok(1));
      service.on("init", callback);

      // Manually remove the hooks map entry to test the branch where hooks is undefined
      const registeredHooks = (service as any).registeredHooks;
      registeredHooks.delete("init");

      // Now try to remove by hookId - hooks should be undefined
      mockPort.off = vi.fn().mockReturnValue(ok(undefined));
      const result = service.off("init", 1);

      expectResultOk(result);
      // Should still call port.off even if hooks map doesn't exist
      expect(mockPort.off).toHaveBeenCalledWith("init", 1);
    });

    it("should handle off() with hookId when callback is not found (coverage for callback branch)", () => {
      // Register a hook first
      const callback = vi.fn();
      mockPort.on = vi.fn().mockReturnValue(ok(1));
      service.on("init", callback);

      // Try to remove with a different hookId that doesn't exist
      mockPort.off = vi.fn().mockReturnValue(ok(undefined));
      const result = service.off("init", 999); // Non-existent hookId

      expectResultOk(result);
      // Should still call port.off
      expect(mockPort.off).toHaveBeenCalledWith("init", 999);
    });

    it("should handle off() with hookId when hookInfos doesn't exist (coverage for hookInfos branch line 98)", () => {
      // Register a hook first
      const callback = vi.fn();
      mockPort.on = vi.fn().mockReturnValue(ok(1));
      service.on("init", callback);

      // Manually remove from callbackToIdMap to test the branch where hookInfos is undefined
      // This tests the else branch of "if (hookInfos)" at line 98
      const callbackToIdMap = (service as any).callbackToIdMap;
      callbackToIdMap.delete(callback);

      // Now try to remove by hookId - callback exists in hooks map, but hookInfos doesn't exist
      mockPort.off = vi.fn().mockReturnValue(ok(undefined));
      const result = service.off("init", 1);

      expectResultOk(result);
      // Should still call port.off even if hookInfos doesn't exist
      expect(mockPort.off).toHaveBeenCalledWith("init", 1);
    });

    it("should handle off() with callback when hookInfos doesn't exist (coverage for hookInfos branch)", () => {
      // Register a hook first
      const callback = vi.fn();
      mockPort.on = vi.fn().mockReturnValue(ok(1));
      service.on("init", callback);

      // Manually remove from callbackToIdMap to test the branch where hookInfos is undefined
      const callbackToIdMap = (service as any).callbackToIdMap;
      callbackToIdMap.delete(callback);

      // Now try to remove by callback - hookInfos should be undefined
      mockPort.off = vi.fn().mockReturnValue(ok(undefined));
      const result = service.off("init", callback);

      expectResultOk(result);
      // Should still call port.off even if hookInfos doesn't exist
      expect(mockPort.off).toHaveBeenCalledWith("init", callback);
    });

    it("should handle off() with callback when hooks map doesn't exist in callback variant (coverage for hooks branch line 119)", () => {
      // Register a hook first
      const callback = vi.fn();
      mockPort.on = vi.fn().mockReturnValue(ok(1));
      service.on("init", callback);

      // Manually remove the hooks map entry to test the branch where hooks is undefined
      const registeredHooks = (service as any).registeredHooks;
      registeredHooks.delete("init");

      // Now try to remove by callback - hooks should be undefined
      mockPort.off = vi.fn().mockReturnValue(ok(undefined));
      const result = service.off("init", callback);

      expectResultOk(result);
      // Should still call port.off even if hooks map doesn't exist
      expect(mockPort.off).toHaveBeenCalledWith("init", callback);
    });

    it("should keep callback in callbackToIdMap when filtered.length > 0 (coverage for else branch line 105)", () => {
      // Register the same callback to multiple hooks
      const callback = vi.fn();
      mockPort.on = vi.fn().mockReturnValueOnce(ok(1)).mockReturnValueOnce(ok(2));
      service.on("init", callback);
      service.on("ready", callback); // Same callback, different hook

      // Remove only one hook registration by hookId
      mockPort.off = vi.fn().mockReturnValue(ok(undefined));
      const result = service.off("init", 1);

      expectResultOk(result);

      // Callback should still be in callbackToIdMap (filtered.length > 0)
      const callbackToIdMap = (service as any).callbackToIdMap;
      expect(callbackToIdMap.has(callback)).toBe(true);
      const remainingInfos = callbackToIdMap.get(callback);
      expect(remainingInfos).toHaveLength(1);
      expect(remainingInfos[0]?.hookName).toBe("ready");
    });

    it("should keep callback in callbackToIdMap when filtered.length > 0 in callback variant (coverage for else branch line 130)", () => {
      // Register the same callback to multiple hooks
      const callback = vi.fn();
      mockPort.on = vi.fn().mockReturnValueOnce(ok(1)).mockReturnValueOnce(ok(2));
      service.on("init", callback);
      service.on("ready", callback); // Same callback, different hook

      // Remove only one hook registration by callback
      mockPort.off = vi.fn().mockReturnValue(ok(undefined));
      const result = service.off("init", callback);

      expectResultOk(result);

      // Callback should still be in callbackToIdMap (filtered.length > 0)
      const callbackToIdMap = (service as any).callbackToIdMap;
      expect(callbackToIdMap.has(callback)).toBe(true);
      const remainingInfos = callbackToIdMap.get(callback);
      expect(remainingInfos).toHaveLength(1);
      expect(remainingInfos[0]?.hookName).toBe("ready");
    });
  });

  describe("Version Detection Failures", () => {
    it("should handle port selector errors", () => {
      const mockEventEmitter = new PortSelectionEventEmitter();
      const mockObservability: ObservabilityRegistry = {
        registerPortSelector: vi.fn(),
      } as any;
      const mockVersionDetector: FoundryVersionDetector = {
        getVersion: vi.fn().mockReturnValue(resultOk(13)),
      } as any;
      const failingSelector = new PortSelector(
        mockVersionDetector,
        mockEventEmitter,
        mockObservability,
        mockContainer
      );
      const mockError = {
        code: "PORT_SELECTION_FAILED" as const,
        message: "No compatible port found",
      };
      vi.spyOn(failingSelector, "selectPortFromTokens").mockReturnValue(err(mockError));
      const failingService = new FoundryHooksPort(
        failingSelector,
        mockRegistry,
        mockRetryService,
        mockLogger
      );

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
      const mockEventEmitter = new PortSelectionEventEmitter();
      const mockObservability: ObservabilityRegistry = {
        registerPortSelector: vi.fn(),
      } as any;
      const mockVersionDetector: FoundryVersionDetector = {
        getVersion: vi.fn().mockReturnValue(resultOk(13)),
      } as any;
      const failingSelector = new PortSelector(
        mockVersionDetector,
        mockEventEmitter,
        mockObservability,
        mockContainer
      );
      const mockError = {
        code: "PORT_SELECTION_FAILED" as const,
        message: "Port selection failed",
      };
      vi.spyOn(failingSelector, "selectPortFromTokens").mockReturnValue(err(mockError));
      const failingService = new FoundryHooksPort(
        failingSelector,
        mockRegistry,
        mockRetryService,
        mockLogger
      );

      const callback = vi.fn();
      const result = failingService.once("init", callback);

      expectResultErr(result);
      expect(result.error.message).toContain("Port selection failed");
    });

    it("should handle port selection failure in off", () => {
      const mockEventEmitter = new PortSelectionEventEmitter();
      const mockObservability: ObservabilityRegistry = {
        registerPortSelector: vi.fn(),
      } as any;
      const mockVersionDetector: FoundryVersionDetector = {
        getVersion: vi.fn().mockReturnValue(resultOk(13)),
      } as any;
      const failingSelector = new PortSelector(
        mockVersionDetector,
        mockEventEmitter,
        mockObservability,
        mockContainer
      );
      const mockError = {
        code: "PORT_SELECTION_FAILED" as const,
        message: "Port selection failed",
      };
      vi.spyOn(failingSelector, "selectPortFromTokens").mockReturnValue(err(mockError));
      const failingService = new FoundryHooksPort(
        failingSelector,
        mockRegistry,
        mockRetryService,
        mockLogger
      );

      const result = failingService.off("init", 1);

      expectResultErr(result);
      expect(result.error.message).toContain("Port selection failed");
    });
  });

  describe("PlatformEventPort Implementation", () => {
    describe("registerListener", () => {
      it("should register a listener and return registration ID", () => {
        const callback = vi.fn();
        mockPort.on = vi.fn().mockReturnValue(ok(42));

        const result = service.registerListener("testEvent", callback);

        expectResultOk(result);
        expect(result.value).toBe(42);
        // registerListener wraps the callback to pass arguments as an array
        expect(mockPort.on).toHaveBeenCalledWith("testEvent", expect.any(Function));

        // Test that the wrapped callback works correctly
        const wrappedCallback = vi
          .mocked(mockPort.on)
          .mock.calls.find((call) => call[0] === "testEvent")?.[1] as (...args: unknown[]) => void;
        expect(wrappedCallback).toBeDefined();

        // Call with multiple arguments (as Foundry hooks do)
        wrappedCallback("arg1", "arg2", "arg3");

        // The original callback should be called with the arguments as an array
        expect(callback).toHaveBeenCalledWith(["arg1", "arg2", "arg3"]);
      });

      it("should return PlatformEventError on registration failure", () => {
        const callback = vi.fn();
        const mockError = {
          code: "API_NOT_AVAILABLE" as const,
          message: "Hooks API not available",
        };
        mockPort.on = vi.fn().mockReturnValue(err(mockError));

        const result = service.registerListener("testEvent", callback);

        expectResultErr(result);
        expect(result.error.code).toBe("EVENT_REGISTRATION_FAILED");
        expect(result.error.message).toContain("Failed to register listener");
        expect(result.error.details).toBe(mockError);
      });

      it("should track registration ID for unregisterListener", () => {
        const callback = vi.fn();
        mockPort.on = vi.fn().mockReturnValue(ok(123));
        mockPort.off = vi.fn().mockReturnValue(ok(undefined));

        const registerResult = service.registerListener("testEvent", callback);
        expectResultOk(registerResult);

        const unregisterResult = service.unregisterListener(registerResult.value);
        expectResultOk(unregisterResult);
        expect(mockPort.off).toHaveBeenCalledWith("testEvent", 123);
      });
    });

    describe("unregisterListener", () => {
      it("should unregister a listener by ID", () => {
        const callback = vi.fn();
        mockPort.on = vi.fn().mockReturnValue(ok(456));
        mockPort.off = vi.fn().mockReturnValue(ok(undefined));

        const registerResult = service.registerListener("testEvent", callback);
        expectResultOk(registerResult);

        const unregisterResult = service.unregisterListener(456);
        expectResultOk(unregisterResult);
        expect(mockPort.off).toHaveBeenCalledWith("testEvent", 456);
      });

      it("should handle string registration IDs", () => {
        const callback = vi.fn();
        mockPort.on = vi.fn().mockReturnValue(ok(789));
        mockPort.off = vi.fn().mockReturnValue(ok(undefined));

        const registerResult = service.registerListener("testEvent", callback);
        expectResultOk(registerResult);

        const unregisterResult = service.unregisterListener("789");
        expectResultOk(unregisterResult);
        expect(mockPort.off).toHaveBeenCalledWith("testEvent", 789);
      });

      it("should return error for invalid string ID", () => {
        const result = service.unregisterListener("invalid");

        expectResultErr(result);
        expect(result.error.code).toBe("EVENT_UNREGISTRATION_FAILED");
        expect(result.error.message).toContain("Invalid registration ID");
      });

      it("should return error for unknown registration ID", () => {
        const result = service.unregisterListener(999);

        expectResultErr(result);
        expect(result.error.code).toBe("EVENT_UNREGISTRATION_FAILED");
        expect(result.error.message).toContain("No registration found");
      });

      it("should return error when off() fails", () => {
        const callback = vi.fn();
        mockPort.on = vi.fn().mockReturnValue(ok(111));
        const mockError = {
          code: "OPERATION_FAILED" as const,
          message: "Failed to unregister",
        };
        mockPort.off = vi.fn().mockReturnValue(err(mockError));

        const registerResult = service.registerListener("testEvent", callback);
        expectResultOk(registerResult);

        const unregisterResult = service.unregisterListener(registerResult.value);
        expectResultErr(unregisterResult);
        expect(unregisterResult.error.code).toBe("EVENT_UNREGISTRATION_FAILED");
        expect(unregisterResult.error.message).toContain("Failed to unregister listener");
      });
    });
  });
});
