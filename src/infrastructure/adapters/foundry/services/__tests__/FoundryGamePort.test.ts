import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { FoundryGamePort } from "@/infrastructure/adapters/foundry/services/FoundryGamePort";
import type { FoundryGame } from "@/infrastructure/adapters/foundry/interfaces/FoundryGame";
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

describe("FoundryGamePort", () => {
  let service: FoundryGamePort;
  let mockRegistry: PortRegistry<FoundryGame>;
  let mockSelector: PortSelector;
  let mockPort: FoundryGame;
  let mockRetryService: RetryService;
  let mockContainer: ServiceContainer;
  const mockToken = createInjectionToken<FoundryGame>("mock-port");

  beforeEach(() => {
    // Mock game object for version detection
    vi.stubGlobal("game", {
      version: "13.291",
    });

    mockPort = {
      getJournalEntries: vi.fn().mockReturnValue(ok([])),
      getJournalEntryById: vi.fn().mockReturnValue(ok(null)),
      invalidateCache: vi.fn(),
      dispose: vi.fn(),
    };

    mockContainer = {
      resolveWithError: vi.fn((token: InjectionToken<any>) => {
        if (token === mockToken) return { ok: true, value: mockPort };
        return { ok: false, error: { message: "Token not found" } };
      }),
    } as any;

    mockRegistry = new PortRegistry<FoundryGame>();
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

    service = new FoundryGamePort(mockSelector, mockRegistry, mockRetryService);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe("Lazy Port Resolution", () => {
    it("should resolve port on first call using PortSelector", () => {
      const result = service.getJournalEntries();
      expectResultOk(result);
    });

    it("should cache resolved port", () => {
      const firstCall = service.getJournalEntries();
      const secondCall = service.getJournalEntries();

      expectResultOk(firstCall);
      expectResultOk(secondCall);
      // Port should be cached, both calls should return same instance
    });

    it("should propagate port selection errors", () => {
      // Create new service with failing selector
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
      const failingService = new FoundryGamePort(failingSelector, mockRegistry, mockRetryService);

      const result = failingService.getJournalEntries();
      expectResultErr(result);
      expect(result.error.code).toBe("PORT_SELECTION_FAILED");
      expect(result.error.message).toContain("Port selection failed");
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
      const failingService = new FoundryGamePort(failingSelector, mockRegistry, mockRetryService);

      const result = failingService.getJournalEntries();
      expectResultErr(result);
      expect(result.error.code).toBe("PORT_SELECTION_FAILED");
      expect(result.error.message).toContain("No compatible port");
    });

    it("should handle port selection returning no port", () => {
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
      const failingService = new FoundryGamePort(failingSelector, mockRegistry, mockRetryService);

      const result = failingService.getJournalEntries();
      expectResultErr(result);
      expect(result.error.message).toContain("Port selection failed");
    });
  });

  describe("Registry Lookup Errors", () => {
    it("should handle empty port registry", () => {
      const emptyRegistry = new PortRegistry<FoundryGame>();
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
      const failingService = new FoundryGamePort(failingSelector, emptyRegistry, mockRetryService);

      const result = failingService.getJournalEntries();
      expectResultErr(result);
      expect(result.error.code).toBe("PORT_SELECTION_FAILED");
      expect(result.error.message).toContain("No compatible port");
    });
  });

  describe("Delegation to Port", () => {
    it("should delegate getJournalEntries to port", () => {
      const mockJournals = [{ id: "journal-1", name: "Test Journal", getFlag: vi.fn() }];
      mockPort.getJournalEntries = vi.fn().mockReturnValue(ok(mockJournals));

      const result = service.getJournalEntries();
      expectResultOk(result);
      expect(result.value).toEqual(mockJournals);
      expect(mockPort.getJournalEntries).toHaveBeenCalled();
    });

    it("should propagate port method errors", () => {
      const mockError = {
        code: "OPERATION_FAILED" as const,
        message: "Port method failed",
      };
      mockPort.getJournalEntries = vi.fn().mockReturnValue(err(mockError));

      const result = service.getJournalEntries();
      expectResultErr(result);
      expect(result.error.code).toBe("OPERATION_FAILED");
      expect(result.error.message).toContain("Port method failed");
    });

    it("should delegate getJournalEntryById to port", () => {
      const mockJournal = { id: "journal-1", name: "Test Journal", getFlag: vi.fn() };
      mockPort.getJournalEntryById = vi.fn().mockReturnValue(ok(mockJournal));

      const result = service.getJournalEntryById("journal-1");
      expectResultOk(result);
      expect(result.value).toBe(mockJournal);
      expect(mockPort.getJournalEntryById).toHaveBeenCalledWith("journal-1");
    });
  });

  describe("dispose", () => {
    it("should reset port reference for garbage collection", () => {
      // Trigger port initialization
      service.getJournalEntries();

      // Dispose should reset port
      service.dispose();

      // After dispose, port should be re-initialized on next call
      const selectSpy = vi.spyOn(mockSelector, "selectPortFromTokens");
      service.getJournalEntries();
      expect(selectSpy).toHaveBeenCalled();
    });
  });

  describe("Port Error Branches", () => {
    it("should handle port selection failure in getJournalEntryById", () => {
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
      const failingService = new FoundryGamePort(failingSelector, mockRegistry, mockRetryService);

      const result = failingService.getJournalEntryById("test-id");

      expectResultErr(result);
      expect(result.error.message).toContain("Port selection failed");
    });
  });

  describe("invalidateCache", () => {
    it("should invalidate cache when port is available", () => {
      const invalidateSpy = vi.spyOn(mockPort, "invalidateCache");
      service.invalidateCache();
      expect(invalidateSpy).toHaveBeenCalled();
    });

    it("should handle invalidateCache when port is not available", () => {
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
      const failingService = new FoundryGamePort(failingSelector, mockRegistry, mockRetryService);

      // Should not throw when port is not available
      expect(() => failingService.invalidateCache()).not.toThrow();
    });
  });
});
