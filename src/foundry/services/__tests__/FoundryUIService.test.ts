import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { FoundryUIService } from "../FoundryUIService";
import type { FoundryUIPort } from "@/foundry/interfaces/FoundryUIPort";
import { PortRegistry } from "@/foundry/versioning/portregistry";
import { PortSelector } from "@/foundry/versioning/PortSelector";
import type { Logger } from "@/interfaces/logger";
import { ok, err } from "@/utils/result";
import { expectResultOk, expectResultErr } from "@/test/utils/test-helpers";
import * as versionDetector from "@/foundry/versioning/versiondetector";

describe("FoundryUIService", () => {
  let service: FoundryUIService;
  let mockRegistry: PortRegistry<FoundryUIPort>;
  let createForVersionSpy: ReturnType<typeof vi.spyOn>;
  let mockSelector: PortSelector;
  let mockLogger: Logger;
  let mockPort: FoundryUIPort;

  beforeEach(() => {
    // Mock game object for version detection
    vi.stubGlobal("game", {
      version: "13.291",
    });

    mockPort = {
      removeJournalElement: vi.fn().mockReturnValue(ok(undefined)),
      findElement: vi.fn().mockReturnValue(ok(null)),
    };

    mockRegistry = new PortRegistry<FoundryUIPort>();
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

    service = new FoundryUIService(mockSelector, mockRegistry);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe("Lazy Port Resolution", () => {
    it("should resolve port on first call", () => {
      const element = document.createElement("div");
      service.removeJournalElement("id", "name", element);

      expect(createForVersionSpy).toHaveBeenCalled();
    });

    it("should cache resolved port", () => {
      const element = document.createElement("div");
      service.removeJournalElement("id", "name", element);
      service.removeJournalElement("id2", "name2", element);

      expect(createForVersionSpy).toHaveBeenCalledTimes(1);
    });

    it("should propagate port resolution errors", () => {
      createForVersionSpy.mockReturnValue(err("Port resolution failed"));

      const element = document.createElement("div");
      const result = service.removeJournalElement("id", "name", element);

      expectResultErr(result);
      expect(result.error).toContain("Port resolution failed");
    });
  });

  describe("removeJournalElement delegation", () => {
    it("should delegate to port", () => {
      const element = document.createElement("div");
      mockPort.removeJournalElement = vi.fn().mockReturnValue(ok(undefined));

      const result = service.removeJournalElement("id", "name", element);

      expectResultOk(result);
      expect(mockPort.removeJournalElement).toHaveBeenCalledWith("id", "name", element);
    });

    it("should handle port errors", () => {
      const element = document.createElement("div");
      mockPort.removeJournalElement = vi.fn().mockReturnValue(err("Element not found"));

      const result = service.removeJournalElement("id", "name", element);

      expectResultErr(result);
      expect(result.error).toContain("Element not found");
    });
  });

  describe("findElement delegation", () => {
    it("should delegate to port", () => {
      const element = document.createElement("div");
      const foundElement = document.createElement("span");
      mockPort.findElement = vi.fn().mockReturnValue(ok(foundElement));

      const result = service.findElement(element, ".selector");

      expectResultOk(result);
      expect(result.value).toBe(foundElement);
      expect(mockPort.findElement).toHaveBeenCalledWith(element, ".selector");
    });
  });

  describe("Version Detection Failures", () => {
    it("should handle getFoundryVersion throwing exception", () => {
      vi.spyOn(versionDetector, "getFoundryVersion").mockImplementation(() => {
        throw new Error("Version detection failed");
      });

      // Create new service instance to trigger getPort() with mocked version detector
      const newService = new FoundryUIService(mockSelector, mockRegistry);
      const element = document.createElement("div");
      const result = newService.removeJournalElement("id", "name", element);

      expectResultErr(result);
      expect(result.error).toContain("Cannot detect Foundry version");
      expect(result.error).toContain("Version detection failed");
    });
  });
});

