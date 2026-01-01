import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { FoundryUIPort } from "@/infrastructure/adapters/foundry/services/FoundryUIPort";
import type { FoundryUI } from "@/infrastructure/adapters/foundry/interfaces/FoundryUI";
import { PortRegistry } from "@/infrastructure/adapters/foundry/versioning/portregistry";
import { PortSelector } from "@/infrastructure/adapters/foundry/versioning/portselector";
import { ok, err } from "@/domain/utils/result";
import { expectResultOk, expectResultErr } from "@/test/utils/test-helpers";
import { PortSelectionEventEmitter } from "@/infrastructure/adapters/foundry/versioning/port-selection-events";
import type { IPortSelectionObservability } from "@/infrastructure/adapters/foundry/versioning/port-selection-observability.interface";
import type { IPortSelectionPerformanceTracker } from "@/infrastructure/adapters/foundry/versioning/port-selection-performance-tracker.interface";
import type { PortSelectionObserver } from "@/infrastructure/adapters/foundry/versioning/port-selection-observer";
import type { PortSelectionEvent } from "@/infrastructure/adapters/foundry/versioning/port-selection-events";
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
      removeJournalDirectoryEntry: vi.fn().mockReturnValue(ok(undefined)),
      findElement: vi.fn().mockReturnValue(ok(null)),
      notify: vi.fn().mockReturnValue(ok(undefined)),
      rerenderJournalDirectory: vi.fn().mockReturnValue(ok(true)),
      getDirectoryElement: vi.fn().mockReturnValue(ok(null)),
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
    const mockObservability: IPortSelectionObservability = {
      registerWithObservabilityRegistry: vi.fn(),
      setupObservability: vi.fn(),
    } as any;
    const mockPerformanceTracker: IPortSelectionPerformanceTracker = {
      startTracking: vi.fn(),
      endTracking: vi.fn().mockReturnValue(0),
    } as any;
    const mockObserver: PortSelectionObserver = {
      handleEvent: vi.fn((event: PortSelectionEvent) => {
        mockEventEmitter.emit(event);
      }),
    } as any;
    mockSelector = new PortSelector(
      mockVersionDetector,
      mockEventEmitter,
      mockObservability,
      mockPerformanceTracker,
      mockObserver,
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
      const result = service.removeJournalDirectoryEntry("journal", "id", "name");
      expectResultOk(result);
    });

    it("should cache resolved port", () => {
      const firstCall = service.removeJournalDirectoryEntry("journal", "id", "name");
      const secondCall = service.removeJournalDirectoryEntry("journal", "id2", "name2");

      expectResultOk(firstCall);
      expectResultOk(secondCall);
    });

    it("should propagate port selection errors", () => {
      const mockEventEmitter = new PortSelectionEventEmitter();
      const mockObservability: IPortSelectionObservability = {
        registerWithObservabilityRegistry: vi.fn(),
        setupObservability: vi.fn(),
      } as any;
      const mockPerformanceTracker: IPortSelectionPerformanceTracker = {
        startTracking: vi.fn(),
        endTracking: vi.fn().mockReturnValue(0),
      } as any;
      const mockObserver: PortSelectionObserver = {
        handleEvent: vi.fn((event: PortSelectionEvent) => {
          mockEventEmitter.emit(event);
        }),
      } as any;
      const mockVersionDetector: FoundryVersionDetector = {
        getVersion: vi.fn().mockReturnValue(resultOk(13)),
      } as any;
      const failingSelector = new PortSelector(
        mockVersionDetector,
        mockEventEmitter,
        mockObservability,
        mockPerformanceTracker,
        mockObserver,
        mockContainer
      );
      const mockError = {
        code: "PORT_SELECTION_FAILED" as const,
        message: "Port selection failed",
      };
      vi.spyOn(failingSelector, "selectPortFromTokens").mockReturnValue(err(mockError));
      const failingService = new FoundryUIPort(failingSelector, mockRegistry, mockRetryService);

      const result = failingService.removeJournalDirectoryEntry("journal", "id", "name");

      expectResultErr(result);
      expect(result.error.message).toContain("Port selection failed");
    });
  });

  describe("removeJournalDirectoryEntry delegation", () => {
    it("should delegate to port", () => {
      mockPort.removeJournalDirectoryEntry = vi.fn().mockReturnValue(ok(undefined));

      const result = service.removeJournalDirectoryEntry("journal", "id", "name");

      expectResultOk(result);
      expect(mockPort.removeJournalDirectoryEntry).toHaveBeenCalledWith("journal", "id", "name");
    });

    it("should handle port errors", () => {
      const mockError = {
        code: "NOT_FOUND" as const,
        message: "Element not found",
      };
      mockPort.removeJournalDirectoryEntry = vi.fn().mockReturnValue(err(mockError));

      const result = service.removeJournalDirectoryEntry("journal", "id", "name");

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
      const mockObservability: IPortSelectionObservability = {
        registerWithObservabilityRegistry: vi.fn(),
        setupObservability: vi.fn(),
      } as any;
      const mockPerformanceTracker: IPortSelectionPerformanceTracker = {
        startTracking: vi.fn(),
        endTracking: vi.fn().mockReturnValue(0),
      } as any;
      const mockObserver: PortSelectionObserver = {
        handleEvent: vi.fn((event: PortSelectionEvent) => {
          mockEventEmitter.emit(event);
        }),
      } as any;
      const mockVersionDetector: FoundryVersionDetector = {
        getVersion: vi.fn().mockReturnValue(resultOk(13)),
      } as any;
      const failingSelector = new PortSelector(
        mockVersionDetector,
        mockEventEmitter,
        mockObservability,
        mockPerformanceTracker,
        mockObserver,
        mockContainer
      );
      const mockError = {
        code: "PORT_SELECTION_FAILED" as const,
        message: "No compatible port found",
      };
      vi.spyOn(failingSelector, "selectPortFromTokens").mockReturnValue(err(mockError));
      const failingService = new FoundryUIPort(failingSelector, mockRegistry, mockRetryService);

      const result = failingService.removeJournalDirectoryEntry("journal", "id", "name");

      expectResultErr(result);
      expect(result.error.message).toContain("No compatible port");
    });
  });

  describe("dispose", () => {
    it("should reset port reference for garbage collection", () => {
      // Trigger port initialization
      service.removeJournalDirectoryEntry("journal", "id", "name");

      // Dispose should reset port
      service.dispose();

      // After dispose, port should be re-initialized on next call
      const selectSpy = vi.spyOn(mockSelector, "selectPortFromTokens");
      service.removeJournalDirectoryEntry("journal", "id", "name");
      expect(selectSpy).toHaveBeenCalled();
    });

    it("should call dispose on port if it implements Disposable", () => {
      const mockDispose = vi.fn();
      // Ensure port has dispose method to be recognized as Disposable
      mockPort.dispose = mockDispose;

      // Trigger port initialization
      service.removeJournalDirectoryEntry("journal", "id", "name");

      // Dispose should call port.dispose() if port is Disposable
      service.dispose();

      expect(mockDispose).toHaveBeenCalled();
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

  describe("getDirectoryElement delegation", () => {
    it("should delegate to port", () => {
      const mockElement = document.createElement("div");
      mockPort.getDirectoryElement = vi.fn().mockReturnValue(ok(mockElement));

      const result = service.getDirectoryElement("journal");

      expectResultOk(result);
      expect(result.value).toBe(mockElement);
      expect(mockPort.getDirectoryElement).toHaveBeenCalledWith("journal");
    });

    it("should handle port selection failure (coverage for line 70)", () => {
      const mockEventEmitter = new PortSelectionEventEmitter();
      const mockObservability: IPortSelectionObservability = {
        registerWithObservabilityRegistry: vi.fn(),
        setupObservability: vi.fn(),
      } as any;
      const mockPerformanceTracker: IPortSelectionPerformanceTracker = {
        startTracking: vi.fn(),
        endTracking: vi.fn().mockReturnValue(0),
      } as any;
      const mockObserver: PortSelectionObserver = {
        handleEvent: vi.fn((event: PortSelectionEvent) => {
          mockEventEmitter.emit(event);
        }),
      } as any;
      const mockVersionDetector: FoundryVersionDetector = {
        getVersion: vi.fn().mockReturnValue(resultOk(13)),
      } as any;
      const failingSelector = new PortSelector(
        mockVersionDetector,
        mockEventEmitter,
        mockObservability,
        mockPerformanceTracker,
        mockObserver,
        mockContainer
      );
      const mockError = {
        code: "PORT_SELECTION_FAILED" as const,
        message: "Port selection failed",
      };
      vi.spyOn(failingSelector, "selectPortFromTokens").mockReturnValue(err(mockError));
      const failingService = new FoundryUIPort(failingSelector, mockRegistry, mockRetryService);

      const result = failingService.getDirectoryElement("journal");

      expectResultErr(result);
      expect(result.error.message).toContain("Port selection failed");
    });

    it("should handle port errors", () => {
      const mockError = {
        code: "NOT_FOUND" as const,
        message: "Directory not found",
      };
      mockPort.getDirectoryElement = vi.fn().mockReturnValue(err(mockError));

      const result = service.getDirectoryElement("journal");

      expectResultErr(result);
      expect(result.error.message).toContain("Directory not found");
    });
  });

  describe("Port Error Branches", () => {
    it("should handle port selection failure in findElement", () => {
      const mockEventEmitter = new PortSelectionEventEmitter();
      const mockObservability: IPortSelectionObservability = {
        registerWithObservabilityRegistry: vi.fn(),
        setupObservability: vi.fn(),
      } as any;
      const mockPerformanceTracker: IPortSelectionPerformanceTracker = {
        startTracking: vi.fn(),
        endTracking: vi.fn().mockReturnValue(0),
      } as any;
      const mockObserver: PortSelectionObserver = {
        handleEvent: vi.fn((event: PortSelectionEvent) => {
          mockEventEmitter.emit(event);
        }),
      } as any;
      const mockVersionDetector: FoundryVersionDetector = {
        getVersion: vi.fn().mockReturnValue(resultOk(13)),
      } as any;
      const failingSelector = new PortSelector(
        mockVersionDetector,
        mockEventEmitter,
        mockObservability,
        mockPerformanceTracker,
        mockObserver,
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
      const mockObservability: IPortSelectionObservability = {
        registerWithObservabilityRegistry: vi.fn(),
        setupObservability: vi.fn(),
      } as any;
      const mockPerformanceTracker: IPortSelectionPerformanceTracker = {
        startTracking: vi.fn(),
        endTracking: vi.fn().mockReturnValue(0),
      } as any;
      const mockObserver: PortSelectionObserver = {
        handleEvent: vi.fn((event: PortSelectionEvent) => {
          mockEventEmitter.emit(event);
        }),
      } as any;
      const mockVersionDetector: FoundryVersionDetector = {
        getVersion: vi.fn().mockReturnValue(resultOk(13)),
      } as any;
      const failingSelector = new PortSelector(
        mockVersionDetector,
        mockEventEmitter,
        mockObservability,
        mockPerformanceTracker,
        mockObserver,
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
      const mockObservability: IPortSelectionObservability = {
        registerWithObservabilityRegistry: vi.fn(),
        setupObservability: vi.fn(),
      } as any;
      const mockPerformanceTracker: IPortSelectionPerformanceTracker = {
        startTracking: vi.fn(),
        endTracking: vi.fn().mockReturnValue(0),
      } as any;
      const mockObserver: PortSelectionObserver = {
        handleEvent: vi.fn((event: PortSelectionEvent) => {
          mockEventEmitter.emit(event);
        }),
      } as any;
      const mockVersionDetector: FoundryVersionDetector = {
        getVersion: vi.fn().mockReturnValue(resultOk(13)),
      } as any;
      const failingSelector = new PortSelector(
        mockVersionDetector,
        mockEventEmitter,
        mockObservability,
        mockPerformanceTracker,
        mockObserver,
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

  describe("dispose", () => {
    it("should dispose port when it implements Disposable", () => {
      // Trigger port initialization
      service.notify("Test", "info");

      const disposeSpy = vi.spyOn(mockPort, "dispose");
      service.dispose();

      expect(disposeSpy).toHaveBeenCalledOnce();
    });

    it("should clear cache even when port does not implement Disposable", () => {
      // Create a port without dispose method (use unknown cast to allow missing dispose)
      const nonDisposablePort = {
        removeJournalElement: vi.fn().mockReturnValue(ok(undefined)),
        findElement: vi.fn().mockReturnValue(ok(null)),
        notify: vi.fn().mockReturnValue(ok(undefined)),
        rerenderJournalDirectory: vi.fn().mockReturnValue(ok(true)),
        // No dispose method - this tests the else branch in dispose()
      } as unknown as FoundryUI;

      vi.spyOn(mockSelector, "selectPortFromTokens").mockReturnValue(ok(nonDisposablePort));

      // Trigger port initialization
      service.notify("Test", "info");

      // Dispose should not throw and should clear cache
      expect(() => service.dispose()).not.toThrow();
    });
  });
});
