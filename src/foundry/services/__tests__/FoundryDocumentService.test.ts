import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { FoundryDocumentService } from "../FoundryDocumentService";
import type { FoundryDocumentPort } from "@/foundry/interfaces/FoundryDocumentPort";
import { PortRegistry } from "@/foundry/versioning/portregistry";
import { PortSelector } from "@/foundry/versioning/PortSelector";
import type { Logger } from "@/interfaces/logger";
import { ok, err } from "@/utils/result";
import { expectResultOk, expectResultErr } from "@/test/utils/test-helpers";
import * as versionDetector from "@/foundry/versioning/versiondetector";

describe("FoundryDocumentService", () => {
  let service: FoundryDocumentService;
  let mockRegistry: PortRegistry<FoundryDocumentPort>;
  let createForVersionSpy: ReturnType<typeof vi.spyOn>;
  let mockSelector: PortSelector;
  let mockLogger: Logger;
  let mockPort: FoundryDocumentPort;

  beforeEach(() => {
    // Mock game object for version detection
    vi.stubGlobal("game", {
      version: "13.291",
    });

    mockPort = {
      getFlag: vi.fn().mockReturnValue(ok(null)),
      setFlag: vi.fn().mockResolvedValue(ok(undefined)),
    };

    mockRegistry = new PortRegistry<FoundryDocumentPort>();
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

    service = new FoundryDocumentService(mockSelector, mockRegistry);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe("Lazy Port Resolution", () => {
    it("should resolve port on first call", () => {
      const document = { getFlag: vi.fn() };
      service.getFlag(document, "scope", "key");

      expect(createForVersionSpy).toHaveBeenCalled();
    });

    it("should cache resolved port", () => {
      const document = { getFlag: vi.fn() };
      service.getFlag(document, "scope", "key");
      service.getFlag(document, "scope", "key");

      expect(createForVersionSpy).toHaveBeenCalledTimes(1);
    });

    it("should propagate port resolution errors", () => {
      createForVersionSpy.mockReturnValue(err("Port resolution failed"));

      const document = { getFlag: vi.fn() };
      const result = service.getFlag(document, "scope", "key");

      expectResultErr(result);
      expect(result.error).toContain("Port resolution failed");
    });
  });

  describe("getFlag delegation", () => {
    it("should delegate to port", () => {
      const document = { getFlag: vi.fn() };
      mockPort.getFlag = vi.fn().mockReturnValue(ok("value"));

      const result = service.getFlag(document, "scope", "key");

      expectResultOk(result);
      expect(result.value).toBe("value");
      expect(mockPort.getFlag).toHaveBeenCalledWith(document, "scope", "key");
    });
  });

  describe("setFlag delegation", () => {
    it("should delegate to port async", async () => {
      const document = { setFlag: vi.fn() };
      mockPort.setFlag = vi.fn().mockResolvedValue(ok(undefined));

      const result = await service.setFlag(document, "scope", "key", "value");

      expectResultOk(result);
      expect(mockPort.setFlag).toHaveBeenCalledWith(document, "scope", "key", "value");
    });

    it("should handle async errors", async () => {
      const document = { setFlag: vi.fn() };
      mockPort.setFlag = vi.fn().mockResolvedValue(err("Async error"));

      const result = await service.setFlag(document, "scope", "key", "value");

      expectResultErr(result);
      expect(result.error).toContain("Async error");
    });
  });

  describe("Version Detection Failures", () => {
    it("should handle getFoundryVersion throwing exception", () => {
      vi.spyOn(versionDetector, "getFoundryVersion").mockImplementation(() => {
        throw new Error("Version detection failed");
      });

      // Create new service instance to trigger getPort() with mocked version detector
      const newService = new FoundryDocumentService(mockSelector, mockRegistry);
      const document = { getFlag: vi.fn() };
      const result = newService.getFlag(document, "scope", "key");

      expectResultErr(result);
      expect(result.error).toContain("Cannot detect Foundry version");
      expect(result.error).toContain("Version detection failed");
    });
  });
});

