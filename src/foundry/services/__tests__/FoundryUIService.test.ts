import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { FoundryUIService } from "../FoundryUIService";
import type { FoundryUI } from "@/foundry/interfaces/FoundryUI";
import { PortRegistry } from "@/foundry/versioning/portregistry";
import { PortSelector } from "@/foundry/versioning/portselector";
import { ok, err } from "@/utils/result";
import { expectResultOk, expectResultErr } from "@/test/utils/test-helpers";

describe("FoundryUIService", () => {
  let service: FoundryUIService;
  let mockRegistry: PortRegistry<FoundryUI>;
  let mockSelector: PortSelector;
  let mockPort: FoundryUI;

  beforeEach(() => {
    // Mock game object for version detection
    vi.stubGlobal("game", {
      version: "13.291",
    });

    mockPort = {
      removeJournalElement: vi.fn().mockReturnValue(ok(undefined)),
      findElement: vi.fn().mockReturnValue(ok(null)),
    };

    mockRegistry = new PortRegistry<FoundryUI>();
    // FIX: Use new getFactories() API instead of getAvailablePorts()
    vi.spyOn(mockRegistry, "getFactories").mockReturnValue(new Map([[13, () => mockPort]]));

    mockSelector = new PortSelector();
    // FIX: Use new selectPortFromFactories() API instead of selectPort()
    vi.spyOn(mockSelector, "selectPortFromFactories").mockReturnValue(ok(mockPort));

    service = new FoundryUIService(mockSelector, mockRegistry);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe("Lazy Port Resolution", () => {
    it("should resolve port on first call using PortSelector", () => {
      const element = document.createElement("div");
      const result = service.removeJournalElement("id", "name", element);
      expectResultOk(result);
    });

    it("should cache resolved port", () => {
      const element = document.createElement("div");
      const firstCall = service.removeJournalElement("id", "name", element);
      const secondCall = service.removeJournalElement("id2", "name2", element);

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
      const failingService = new FoundryUIService(failingSelector, mockRegistry);

      const element = document.createElement("div");
      const result = failingService.removeJournalElement("id", "name", element);

      expectResultErr(result);
      expect(result.error).toContain("Port selection failed");
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
      const mockError = {
        code: "NOT_FOUND" as const,
        message: "Element not found",
      };
      mockPort.removeJournalElement = vi.fn().mockReturnValue(err(mockError));

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
    it("should handle port selector errors", () => {
      const failingSelector = new PortSelector();
      const mockError = {
        code: "PORT_SELECTION_FAILED" as const,
        message: "No compatible port found",
      };
      vi.spyOn(failingSelector, "selectPortFromFactories").mockReturnValue(err(mockError));
      const failingService = new FoundryUIService(failingSelector, mockRegistry);

      const element = document.createElement("div");
      const result = failingService.removeJournalElement("id", "name", element);

      expectResultErr(result);
      expect(result.error).toContain("No compatible port");
    });
  });
});
