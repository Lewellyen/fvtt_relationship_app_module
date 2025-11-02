import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { FoundryGameService } from "../FoundryGameService";
import type { FoundryGamePort } from "@/foundry/interfaces/FoundryGamePort";
import { PortRegistry } from "@/foundry/versioning/portregistry";
import { PortSelector } from "@/foundry/versioning/PortSelector";
import type { Logger } from "@/interfaces/logger";
import { ok, err } from "@/utils/result";
import { expectResultOk, expectResultErr } from "@/test/utils/test-helpers";
import * as versionDetector from "@/foundry/versioning/versiondetector";

describe("FoundryGameService", () => {
  let service: FoundryGameService;
  let mockRegistry: PortRegistry<FoundryGamePort>;
  let createForVersionSpy: ReturnType<typeof vi.spyOn>;
  let mockSelector: PortSelector;
  let mockLogger: Logger;
  let mockPort: FoundryGamePort;

  beforeEach(() => {
    // Mock game object for version detection
    vi.stubGlobal("game", {
      version: "13.291",
    });

    mockPort = {
      getJournalEntries: vi.fn().mockReturnValue(ok([])),
    };

    mockRegistry = new PortRegistry<FoundryGamePort>();
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

    service = new FoundryGameService(mockSelector, mockRegistry);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe("Lazy Port Resolution", () => {
    it("should resolve port on first call", () => {
      const result = service.getJournalEntries();
      expectResultOk(result);
      expect(createForVersionSpy).toHaveBeenCalled();
    });

    it("should cache resolved port", () => {
      service.getJournalEntries();
      service.getJournalEntries();

      expect(createForVersionSpy).toHaveBeenCalledTimes(1);
    });

    it("should propagate port resolution errors", () => {
      createForVersionSpy.mockReturnValue(err("Port resolution failed"));

      const result = service.getJournalEntries();
      expectResultErr(result);
      expect(result.error).toContain("Port resolution failed");
    });
  });

  describe("Version Detection Failures", () => {
    it("should handle version detection errors via createForVersion", () => {
      createForVersionSpy.mockReturnValue(err("Could not determine Foundry version"));

      const result = service.getJournalEntries();
      expectResultErr(result);
      expect(result.error).toContain("version");
    });

    it("should handle getFoundryVersion throwing exception", () => {
      vi.spyOn(versionDetector, "getFoundryVersion").mockImplementation(() => {
        throw new Error("Version detection failed");
      });

      // Create new service instance to trigger getPort() with mocked version detector
      const newService = new FoundryGameService(mockSelector, mockRegistry);
      const result = newService.getJournalEntries();

      expectResultErr(result);
      expect(result.error).toContain("Cannot detect Foundry version");
      expect(result.error).toContain("Version detection failed");
    });
  });

  describe("Registry Lookup Errors", () => {
    it("should handle no compatible port available", () => {
      createForVersionSpy.mockReturnValue(err("No compatible port for Foundry v12"));

      const result = service.getJournalEntries();
      expectResultErr(result);
      expect(result.error).toContain("No compatible port");
    });
  });

  describe("Delegation to Port", () => {
    it("should delegate getJournalEntries to port", () => {
      const mockJournals = [
        { id: "journal-1", name: "Test Journal", getFlag: vi.fn() },
      ];
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

