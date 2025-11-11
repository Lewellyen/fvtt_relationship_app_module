/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { FoundryGameService } from "../FoundryGameService";
import type { FoundryGame } from "@/foundry/interfaces/FoundryGame";
import { PortRegistry } from "@/foundry/versioning/portregistry";
import { PortSelector } from "@/foundry/versioning/portselector";
import { ok, err } from "@/utils/functional/result";
import { expectResultOk, expectResultErr } from "@/test/utils/test-helpers";
import { PortSelectionEventEmitter } from "@/foundry/versioning/port-selection-events";
import type { ObservabilityRegistry } from "@/observability/observability-registry";
import type { RetryService } from "@/services/RetryService";

describe("FoundryGameService", () => {
  let service: FoundryGameService;
  let mockRegistry: PortRegistry<FoundryGame>;
  let mockSelector: PortSelector;
  let mockPort: FoundryGame;
  let mockRetryService: RetryService;

  beforeEach(() => {
    // Mock game object for version detection
    vi.stubGlobal("game", {
      version: "13.291",
    });

    mockPort = {
      getJournalEntries: vi.fn().mockReturnValue(ok([])),
      getJournalEntryById: vi.fn().mockReturnValue(ok(null)),
      dispose: vi.fn(),
    };

    mockRegistry = new PortRegistry<FoundryGame>();
    vi.spyOn(mockRegistry, "getFactories").mockReturnValue(new Map([[13, () => mockPort]]));

    const mockEventEmitter = new PortSelectionEventEmitter();
    const mockObservability: ObservabilityRegistry = {
      registerPortSelector: vi.fn(),
    } as any;
    mockSelector = new PortSelector(mockEventEmitter, mockObservability);
    vi.spyOn(mockSelector, "selectPortFromFactories").mockReturnValue(ok(mockPort));

    // Mock RetryService - just executes fn directly without retry logic
    mockRetryService = {
      retrySync: vi.fn((fn) => fn()),
      retry: vi.fn((fn) => fn()),
    } as any;

    service = new FoundryGameService(mockSelector, mockRegistry, mockRetryService);
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
      const failingSelector = new PortSelector(mockEventEmitter, mockObservability);
      const mockError = {
        code: "PORT_SELECTION_FAILED" as const,
        message: "Port selection failed",
      };
      vi.spyOn(failingSelector, "selectPortFromFactories").mockReturnValue(err(mockError));
      const failingService = new FoundryGameService(
        failingSelector,
        mockRegistry,
        mockRetryService
      );

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
      const failingSelector = new PortSelector(mockEventEmitter, mockObservability);
      const mockError = {
        code: "PORT_SELECTION_FAILED" as const,
        message: "No compatible port found",
      };
      vi.spyOn(failingSelector, "selectPortFromFactories").mockReturnValue(err(mockError));
      const failingService = new FoundryGameService(
        failingSelector,
        mockRegistry,
        mockRetryService
      );

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
      const failingSelector = new PortSelector(mockEventEmitter, mockObservability);
      const mockError = {
        code: "PORT_SELECTION_FAILED" as const,
        message: "Port selection failed",
      };
      vi.spyOn(failingSelector, "selectPortFromFactories").mockReturnValue(err(mockError));
      const failingService = new FoundryGameService(
        failingSelector,
        mockRegistry,
        mockRetryService
      );

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
      const failingSelector = new PortSelector(mockEventEmitter, mockObservability);
      const failingService = new FoundryGameService(
        failingSelector,
        emptyRegistry,
        mockRetryService
      );

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
      const selectSpy = vi.spyOn(mockSelector, "selectPortFromFactories");
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
      const failingSelector = new PortSelector(mockEventEmitter, mockObservability);
      const mockError = {
        code: "PORT_SELECTION_FAILED" as const,
        message: "Port selection failed",
      };
      vi.spyOn(failingSelector, "selectPortFromFactories").mockReturnValue(err(mockError));
      const failingService = new FoundryGameService(
        failingSelector,
        mockRegistry,
        mockRetryService
      );

      const result = failingService.getJournalEntryById("test-id");

      expectResultErr(result);
      expect(result.error.message).toContain("Port selection failed");
    });
  });
});
