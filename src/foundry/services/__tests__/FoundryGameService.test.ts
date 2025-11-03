import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { FoundryGameService } from "../FoundryGameService";
import type { FoundryGame } from "@/foundry/interfaces/FoundryGame";
import { PortRegistry } from "@/foundry/versioning/portregistry";
import { PortSelector } from "@/foundry/versioning/portselector";
import { ok, err } from "@/utils/result";
import { expectResultOk, expectResultErr } from "@/test/utils/test-helpers";

describe("FoundryGameService", () => {
  let service: FoundryGameService;
  let mockRegistry: PortRegistry<FoundryGame>;
  let mockSelector: PortSelector;
  let mockPort: FoundryGame;

  beforeEach(() => {
    // Mock game object for version detection
    vi.stubGlobal("game", {
      version: "13.291",
    });

    mockPort = {
      getJournalEntries: vi.fn().mockReturnValue(ok([])),
      getJournalEntryById: vi.fn().mockReturnValue(ok(null)),
    };

    mockRegistry = new PortRegistry<FoundryGame>();
    // FIX: Use new getFactories() API instead of getAvailablePorts()
    vi.spyOn(mockRegistry, "getFactories").mockReturnValue(new Map([[13, () => mockPort]]));

    mockSelector = new PortSelector();
    // FIX: Use new selectPortFromFactories() API instead of selectPort()
    vi.spyOn(mockSelector, "selectPortFromFactories").mockReturnValue(ok(mockPort));

    service = new FoundryGameService(mockSelector, mockRegistry);
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
      const failingSelector = new PortSelector();
      vi.spyOn(failingSelector, "selectPortFromFactories").mockReturnValue(
        err("Port selection failed")
      );
      const failingService = new FoundryGameService(failingSelector, mockRegistry);

      const result = failingService.getJournalEntries();
      expectResultErr(result);
      expect(result.error).toContain("Port selection failed");
    });
  });

  describe("Version Detection Failures", () => {
    it("should handle port selector errors", () => {
      const failingSelector = new PortSelector();
      vi.spyOn(failingSelector, "selectPortFromFactories").mockReturnValue(
        err("No compatible port found")
      );
      const failingService = new FoundryGameService(failingSelector, mockRegistry);

      const result = failingService.getJournalEntries();
      expectResultErr(result);
      expect(result.error).toContain("No compatible port");
    });

    it("should handle port selection returning no port", () => {
      const failingSelector = new PortSelector();
      vi.spyOn(failingSelector, "selectPortFromFactories").mockReturnValue(
        err("Port selection failed")
      );
      const failingService = new FoundryGameService(failingSelector, mockRegistry);

      const result = failingService.getJournalEntries();
      expectResultErr(result);
      expect(result.error).toContain("Port selection failed");
    });
  });

  describe("Registry Lookup Errors", () => {
    it("should handle empty port registry", () => {
      const emptyRegistry = new PortRegistry<FoundryGame>();
      const failingSelector = new PortSelector();
      const failingService = new FoundryGameService(failingSelector, emptyRegistry);

      const result = failingService.getJournalEntries();
      expectResultErr(result);
      expect(result.error).toContain("No compatible port");
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
      mockPort.getJournalEntries = vi.fn().mockReturnValue(err("Port method failed"));

      const result = service.getJournalEntries();
      expectResultErr(result);
      expect(result.error).toContain("Port method failed");
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
});
