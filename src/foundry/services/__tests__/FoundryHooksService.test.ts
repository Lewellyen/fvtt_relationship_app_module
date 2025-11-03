import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { FoundryHooksService } from "../FoundryHooksService";
import type { FoundryHooks } from "@/foundry/interfaces/FoundryHooks";
import { PortRegistry } from "@/foundry/versioning/portregistry";
import { PortSelector } from "@/foundry/versioning/portselector";
import { ok, err } from "@/utils/result";
import { expectResultOk, expectResultErr } from "@/test/utils/test-helpers";

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
      on: vi.fn().mockReturnValue(ok(undefined)),
      off: vi.fn().mockReturnValue(ok(undefined)),
    };

    mockRegistry = new PortRegistry<FoundryHooks>();
    // FIX: Use new getFactories() API instead of getAvailablePorts()
    vi.spyOn(mockRegistry, "getFactories").mockReturnValue(new Map([[13, () => mockPort]]));

    mockSelector = new PortSelector();
    // FIX: Use new selectPortFromFactories() API instead of selectPort()
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
      const failingSelector = new PortSelector();
      const mockError = {
        code: "PORT_SELECTION_FAILED" as const,
        message: "Port selection failed",
      };
      vi.spyOn(failingSelector, "selectPortFromFactories").mockReturnValue(err(mockError));
      const failingService = new FoundryHooksService(failingSelector, mockRegistry);

      const callback = vi.fn();
      const result = failingService.on("init", callback);

      expectResultErr(result);
      expect(result.error).toContain("Port selection failed");
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
      expect(result.error).toContain("Hook registration failed");
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
  });

  describe("Version Detection Failures", () => {
    it("should handle port selector errors", () => {
      const failingSelector = new PortSelector();
      const mockError = {
        code: "PORT_SELECTION_FAILED" as const,
        message: "No compatible port found",
      };
      vi.spyOn(failingSelector, "selectPortFromFactories").mockReturnValue(err(mockError));
      const failingService = new FoundryHooksService(failingSelector, mockRegistry);

      const callback = vi.fn();
      const result = failingService.on("init", callback);

      expectResultErr(result);
      expect(result.error).toContain("No compatible port");
    });
  });
});
