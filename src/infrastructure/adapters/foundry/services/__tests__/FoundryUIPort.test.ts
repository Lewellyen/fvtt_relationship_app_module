/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { FoundryUIPort } from "@/infrastructure/adapters/foundry/services/FoundryUIPort";
import type { FoundryUI } from "@/infrastructure/adapters/foundry/interfaces/FoundryUI";
import { PortRegistry } from "@/infrastructure/adapters/foundry/versioning/portregistry";
import { PortSelector } from "@/infrastructure/adapters/foundry/versioning/portselector";
import { ok, err } from "@/domain/utils/result";
import { expectResultOk, expectResultErr } from "@/test/utils/test-helpers";
import { PortSelectionEventEmitter } from "@/infrastructure/adapters/foundry/versioning/port-selection-events";
import type { ObservabilityRegistry } from "@/infrastructure/observability/observability-registry";
import type { RetryService } from "@/infrastructure/retry/RetryService";
import type { ServiceContainer } from "@/infrastructure/di/container";
import type { InjectionToken } from "@/infrastructure/di/types/core/injectiontoken";
import { createInjectionToken } from "@/infrastructure/di/token-factory";
import type { FoundryVersionDetector } from "@/infrastructure/adapters/foundry/versioning/foundry-version-detector";
import { ok as resultOk } from "@/domain/utils/result";

describe("FoundryUIPort", () => {
  let service: FoundryUIPort;
  let mockRegistry: PortRegistry<FoundryUI>;
  let mockSelector: PortSelector;
  let mockPort: FoundryUI;
  let mockRetryService: RetryService;
  let mockContainer: ServiceContainer;
  const mockToken = createInjectionToken<FoundryUI>("mock-port");

  beforeEach(() => {
    // Mock game object for version detection
    vi.stubGlobal("game", {
      version: "13.291",
    });

    mockPort = {
      removeJournalElement: vi.fn().mockReturnValue(ok(undefined)),
      findElement: vi.fn().mockReturnValue(ok(null)),
      notify: vi.fn().mockReturnValue(ok(undefined)),
      rerenderJournalDirectory: vi.fn().mockReturnValue(ok(true)),
      dispose: vi.fn(),
    };

    mockContainer = {
      resolveWithError: vi.fn((token: InjectionToken<any>) => {
        if (token === mockToken) return { ok: true, value: mockPort };
        return { ok: false, error: { message: "Token not found" } };
      }),
    } as any;

    mockRegistry = new PortRegistry<FoundryUI>();
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

    service = new FoundryUIPort(mockSelector, mockRegistry, mockRetryService);
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
      const failingService = new FoundryUIPort(failingSelector, mockRegistry, mockRetryService);

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
      expect(mockPort.notify).toHaveBeenCalledWith("Test message", "info", undefined);
    });

    it("should delegate to port for error notification", () => {
      mockPort.notify = vi.fn().mockReturnValue(ok(undefined));

      const result = service.notify("Error message", "error");

      expectResultOk(result);
      expect(mockPort.notify).toHaveBeenCalledWith("Error message", "error", undefined);
    });

    it("should forward notification options to port", () => {
      const options = { permanent: true, console: true };
      mockPort.notify = vi.fn().mockReturnValue(ok(undefined));

      const result = service.notify("Heads-up", "info", options);

      expectResultOk(result);
      expect(mockPort.notify).toHaveBeenCalledWith("Heads-up", "info", options);
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
      const failingService = new FoundryUIPort(failingSelector, mockRegistry, mockRetryService);

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
      const selectSpy = vi.spyOn(mockSelector, "selectPortFromTokens");
      service.removeJournalElement("id", "name", element);
      expect(selectSpy).toHaveBeenCalled();
    });
  });

  describe("rerenderJournalDirectory delegation", () => {
    it("should delegate to port and return boolean result", () => {
      mockPort.rerenderJournalDirectory = vi.fn().mockReturnValue(ok(true));

      const result = service.rerenderJournalDirectory();

      expectResultOk(result);
      expect(result.value).toBe(true);
      expect(mockPort.rerenderJournalDirectory).toHaveBeenCalled();
    });

    it("should handle false result when directory not open", () => {
      mockPort.rerenderJournalDirectory = vi.fn().mockReturnValue(ok(false));

      const result = service.rerenderJournalDirectory();

      expectResultOk(result);
      expect(result.value).toBe(false);
    });
  });

  describe("Port Error Branches", () => {
    it("should handle port selection failure in findElement", () => {
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
      const failingService = new FoundryUIPort(failingSelector, mockRegistry, mockRetryService);

      const container = document.createElement("div");
      const result = failingService.findElement(container, ".test");

      expectResultErr(result);
      expect(result.error.message).toContain("Port selection failed");
    });

    it("should handle port selection failure in notify", () => {
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
      const failingService = new FoundryUIPort(failingSelector, mockRegistry, mockRetryService);

      const result = failingService.notify("Test message", "info");

      expectResultErr(result);
      expect(result.error.message).toContain("Port selection failed");
    });

    it("should handle port selection failure in rerenderJournalDirectory", () => {
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
      const failingService = new FoundryUIPort(failingSelector, mockRegistry, mockRetryService);

      const result = failingService.rerenderJournalDirectory();

      expectResultErr(result);
      expect(result.error.message).toContain("Port selection failed");
    });
  });
});
