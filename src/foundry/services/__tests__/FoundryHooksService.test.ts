import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { FoundryHooksService } from "../FoundryHooksService";
import type { FoundryHooksPort } from "@/foundry/interfaces/FoundryHooksPort";
import { PortRegistry } from "@/foundry/versioning/portregistry";
import { PortSelector } from "@/foundry/versioning/PortSelector";
import type { Logger } from "@/interfaces/logger";
import { ok, err } from "@/utils/result";
import { expectResultOk, expectResultErr } from "@/test/utils/test-helpers";
import * as versionDetector from "@/foundry/versioning/versiondetector";

describe("FoundryHooksService", () => {
  let service: FoundryHooksService;
  let mockRegistry: PortRegistry<FoundryHooksPort>;
  let createForVersionSpy: ReturnType<typeof vi.spyOn>;
  let mockSelector: PortSelector;
  let mockLogger: Logger;
  let mockPort: FoundryHooksPort;

  beforeEach(() => {
    // Mock game object for version detection
    vi.stubGlobal("game", {
      version: "13.291",
    });

    mockPort = {
      on: vi.fn().mockReturnValue(ok(undefined)),
      off: vi.fn().mockReturnValue(ok(undefined)),
    };

    mockRegistry = new PortRegistry<FoundryHooksPort>();
    createForVersionSpy = vi.spyOn(mockRegistry, "createForVersion").mockReturnValue(ok(mockPort));

    mockSelector = {
      selectPort: vi.fn(),
    } as unknown as PortSelector;

    mockLogger = {
      debug: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      info: vi.fn(),
      log: vi.fn(),
    };

    service = new FoundryHooksService(mockSelector, mockRegistry);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe("Lazy Port Resolution", () => {
    it("should resolve port on first call", () => {
      const callback = vi.fn();
      service.on("init", callback);

      expect(createForVersionSpy).toHaveBeenCalled();
    });

    it("should cache resolved port", () => {
      const callback = vi.fn();
      service.on("init", callback);
      service.on("ready", callback);

      expect(createForVersionSpy).toHaveBeenCalledTimes(1);
    });

    it("should propagate port resolution errors", () => {
      createForVersionSpy.mockReturnValue(err("Port resolution failed"));

      const callback = vi.fn();
      const result = service.on("init", callback);

      expectResultErr(result);
      expect(result.error).toContain("Port resolution failed");
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
      mockPort.on = vi.fn().mockReturnValue(err("Hook registration failed"));

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
    it("should handle getFoundryVersion throwing exception", () => {
      vi.spyOn(versionDetector, "getFoundryVersion").mockImplementation(() => {
        throw new Error("Version detection failed");
      });

      // Create new service instance to trigger getPort() with mocked version detector
      const newService = new FoundryHooksService(mockSelector, mockRegistry);
      const callback = vi.fn();
      const result = newService.on("init", callback);

      expectResultErr(result);
      expect(result.error).toContain("Cannot detect Foundry version");
      expect(result.error).toContain("Version detection failed");
    });
  });
});

