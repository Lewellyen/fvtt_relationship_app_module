import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { FoundryUIService } from "../FoundryUIService";
import type { FoundryUI } from "@/foundry/interfaces/FoundryUI";
import { PortRegistry } from "@/foundry/versioning/portregistry";
import { PortSelector } from "@/foundry/versioning/portselector";
import { ok, err } from "@/utils/result";
import {
  expectResultOk,
  expectResultErr,
  createMockMetricsCollector,
  createMockLogger,
  createMockEnvironmentConfig,
} from "@/test/utils/test-helpers";

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
      notify: vi.fn().mockReturnValue(ok(undefined)),
    };

    mockRegistry = new PortRegistry<FoundryUI>();
    vi.spyOn(mockRegistry, "getFactories").mockReturnValue(new Map([[13, () => mockPort]]));

    const mockEnv = createMockEnvironmentConfig();
    mockSelector = new PortSelector(
      createMockMetricsCollector(mockEnv),
      createMockLogger(),
      mockEnv
    );
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
      const mockEnv = createMockEnvironmentConfig();
      const failingSelector = new PortSelector(
        createMockMetricsCollector(mockEnv),
        createMockLogger(),
        mockEnv
      );
      const mockError = {
        code: "PORT_SELECTION_FAILED" as const,
        message: "Port selection failed",
      };
      vi.spyOn(failingSelector, "selectPortFromFactories").mockReturnValue(err(mockError));
      const failingService = new FoundryUIService(failingSelector, mockRegistry);

      const element = document.createElement("div");
      const result = failingService.removeJournalElement("id", "name", element);

      expectResultErr(result);
      expect(result.error.message).toContain("Port selection failed");
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
      expect(result.error.message).toContain("Element not found");
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

  describe("notify delegation", () => {
    it("should delegate to port for info notification", () => {
      mockPort.notify = vi.fn().mockReturnValue(ok(undefined));

      const result = service.notify("Test message", "info");

      expectResultOk(result);
      expect(mockPort.notify).toHaveBeenCalledWith("Test message", "info");
    });

    it("should delegate to port for error notification", () => {
      mockPort.notify = vi.fn().mockReturnValue(ok(undefined));

      const result = service.notify("Error message", "error");

      expectResultOk(result);
      expect(mockPort.notify).toHaveBeenCalledWith("Error message", "error");
    });

    it("should handle port errors", () => {
      const mockError = {
        code: "OPERATION_FAILED" as const,
        message: "Notification failed",
      };
      mockPort.notify = vi.fn().mockReturnValue(err(mockError));

      const result = service.notify("Test", "warning");

      expectResultErr(result);
      expect(result.error.message).toContain("Notification failed");
    });
  });

  describe("Version Detection Failures", () => {
    it("should handle port selector errors", () => {
      const mockEnv = createMockEnvironmentConfig();
      const failingSelector = new PortSelector(
        createMockMetricsCollector(mockEnv),
        createMockLogger(),
        mockEnv
      );
      const mockError = {
        code: "PORT_SELECTION_FAILED" as const,
        message: "No compatible port found",
      };
      vi.spyOn(failingSelector, "selectPortFromFactories").mockReturnValue(err(mockError));
      const failingService = new FoundryUIService(failingSelector, mockRegistry);

      const element = document.createElement("div");
      const result = failingService.removeJournalElement("id", "name", element);

      expectResultErr(result);
      expect(result.error.message).toContain("No compatible port");
    });
  });

  describe("dispose", () => {
    it("should reset port reference for garbage collection", () => {
      const element = document.createElement("div");
      // Trigger port initialization
      service.removeJournalElement("id", "name", element);

      // Dispose should reset port
      service.dispose();

      // After dispose, port should be re-initialized on next call
      const selectSpy = vi.spyOn(mockSelector, "selectPortFromFactories");
      service.removeJournalElement("id", "name", element);
      expect(selectSpy).toHaveBeenCalled();
    });
  });

  describe("Port Error Branches", () => {
    it("should handle port selection failure in findElement", () => {
      const mockEnv = createMockEnvironmentConfig();
      const failingSelector = new PortSelector(
        createMockMetricsCollector(mockEnv),
        createMockLogger(),
        mockEnv
      );
      const mockError = {
        code: "PORT_SELECTION_FAILED" as const,
        message: "Port selection failed",
      };
      vi.spyOn(failingSelector, "selectPortFromFactories").mockReturnValue(err(mockError));
      const failingService = new FoundryUIService(failingSelector, mockRegistry);

      const container = document.createElement("div");
      const result = failingService.findElement(container, ".test");

      expectResultErr(result);
      expect(result.error.message).toContain("Port selection failed");
    });

    it("should handle port selection failure in notify", () => {
      const mockEnv = createMockEnvironmentConfig();
      const failingSelector = new PortSelector(
        createMockMetricsCollector(mockEnv),
        createMockLogger(),
        mockEnv
      );
      const mockError = {
        code: "PORT_SELECTION_FAILED" as const,
        message: "Port selection failed",
      };
      vi.spyOn(failingSelector, "selectPortFromFactories").mockReturnValue(err(mockError));
      const failingService = new FoundryUIService(failingSelector, mockRegistry);

      const result = failingService.notify("Test message", "info");

      expectResultErr(result);
      expect(result.error.message).toContain("Port selection failed");
    });
  });
});
