import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { FoundryDocumentService } from "../FoundryDocumentService";
import type { FoundryDocument } from "@/foundry/interfaces/FoundryDocument";
import { PortRegistry } from "@/foundry/versioning/portregistry";
import { PortSelector } from "@/foundry/versioning/portselector";
import { ok, err } from "@/utils/result";
import { expectResultOk, expectResultErr } from "@/test/utils/test-helpers";

describe("FoundryDocumentService", () => {
  let service: FoundryDocumentService;
  let mockRegistry: PortRegistry<FoundryDocument>;
  let mockSelector: PortSelector;
  let mockPort: FoundryDocument;

  beforeEach(() => {
    // Mock game object for version detection
    vi.stubGlobal("game", {
      version: "13.291",
    });

    mockPort = {
      getFlag: vi.fn().mockReturnValue(ok(null)),
      setFlag: vi.fn().mockResolvedValue(ok(undefined)),
    };

    mockRegistry = new PortRegistry<FoundryDocument>();
    // FIX: Use new getFactories() API instead of getAvailablePorts()
    vi.spyOn(mockRegistry, "getFactories").mockReturnValue(new Map([[13, () => mockPort]]));

    mockSelector = new PortSelector();
    // FIX: Use new selectPortFromFactories() API instead of selectPort()
    vi.spyOn(mockSelector, "selectPortFromFactories").mockReturnValue(ok(mockPort));

    service = new FoundryDocumentService(mockSelector, mockRegistry);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe("Lazy Port Resolution", () => {
    it("should resolve port on first call using PortSelector", () => {
      const document = { getFlag: vi.fn() };
      service.getFlag(document, "scope", "key");
      // Port should be successfully resolved
    });

    it("should cache resolved port", () => {
      const document = { getFlag: vi.fn() };
      const firstCall = service.getFlag(document, "scope", "key");
      const secondCall = service.getFlag(document, "scope", "key");

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
      const failingService = new FoundryDocumentService(failingSelector, mockRegistry);

      const document = { getFlag: vi.fn() };
      const result = failingService.getFlag(document, "scope", "key");

      expectResultErr(result);
      expect(result.error).toContain("Port selection failed");
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
      const mockError = {
        code: "OPERATION_FAILED" as const,
        message: "Async error",
      };
      mockPort.setFlag = vi.fn().mockResolvedValue(err(mockError));

      const result = await service.setFlag(document, "scope", "key", "value");

      expectResultErr(result);
      expect(result.error).toContain("Async error");
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
      const failingService = new FoundryDocumentService(failingSelector, mockRegistry);

      const document = { getFlag: vi.fn() };
      const result = failingService.getFlag(document, "scope", "key");

      expectResultErr(result);
      expect(result.error).toContain("No compatible port");
    });
  });
});
