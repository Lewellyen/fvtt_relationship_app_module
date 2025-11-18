/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { FoundryGameService } from "../FoundryGameService";
import type { FoundryGame } from "@/foundry/interfaces/FoundryGame";
import { PortRegistry } from "@/foundry/versioning/portregistry";
import { PortSelector } from "@/foundry/versioning/portselector";
import { ok } from "@/utils/functional/result";
import { expectResultOk } from "@/test/utils/test-helpers";
import { PortSelectionEventEmitter } from "@/foundry/versioning/port-selection-events";
import type { ObservabilityRegistry } from "@/observability/observability-registry";
import type { RetryService } from "@/services/RetryService";
import { createMockJournalEntry } from "@/test/mocks/foundry";
import type { FoundryJournalEntry } from "@/foundry/types";

describe("Concurrency: Journal Access", () => {
  let service: FoundryGameService;
  let mockRegistry: PortRegistry<FoundryGame>;
  let mockSelector: PortSelector;
  let mockPort: FoundryGame;
  let mockRetryService: RetryService;
  let mockEntries: FoundryJournalEntry[];

  beforeEach(() => {
    // Mock game object for version detection
    vi.stubGlobal("game", {
      version: "13.291",
    });

    // Create mock journal entries
    mockEntries = Array.from({ length: 10 }, (_, i) =>
      createMockJournalEntry({ id: `entry-${i}`, name: `Entry ${i}` })
    );

    mockPort = {
      getJournalEntries: vi.fn().mockReturnValue(ok(mockEntries)),
      getJournalEntryById: vi.fn((id: string) => {
        const entry = mockEntries.find((e) => e.id === id);
        return ok(entry || null);
      }),
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

  it.concurrent("should handle concurrent journal entry requests", async () => {
    // 50 parallele Requests
    const promises = Array.from({ length: 50 }, () => service.getJournalEntries());

    const results = await Promise.all(promises);

    // Alle sollten erfolgreich sein
    results.forEach((result) => {
      expectResultOk(result);
    });

    // Alle sollten dieselben Daten zurückgeben
    const firstResult = results[0];
    if (!firstResult || !firstResult.ok) {
      throw new Error("First result should be ok");
    }
    const firstEntries = firstResult.value;
    expect(results.every((r) => r.ok && r.value.length === firstEntries.length)).toBe(true);
    expect(results.every((r) => r.ok && r.value.length === mockEntries.length)).toBe(true);
  });

  it.concurrent("should handle concurrent single entry requests", async () => {
    // 50 parallele Requests für denselben Entry
    const promises = Array.from({ length: 50 }, () => service.getJournalEntryById("entry-0"));

    const results = await Promise.all(promises);

    // Alle sollten erfolgreich sein
    results.forEach((result) => {
      expectResultOk(result);
    });

    // Alle sollten denselben Entry zurückgeben
    const firstResult = results[0];
    if (!firstResult || !firstResult.ok) {
      throw new Error("First result should be ok");
    }
    const firstEntry = firstResult.value;
    expect(firstEntry).not.toBeNull();
    expect(results.every((r) => r.ok && r.value?.id === firstEntry?.id)).toBe(true);
    expect(results.every((r) => r.ok && r.value?.name === firstEntry?.name)).toBe(true);
  });

  it.concurrent("should handle concurrent requests for different entries", async () => {
    // 50 parallele Requests für verschiedene Entries
    const promises = Array.from({ length: 50 }, (_, i) =>
      service.getJournalEntryById(`entry-${i % 10}`)
    );

    const results = await Promise.all(promises);

    // Alle sollten erfolgreich sein
    results.forEach((result) => {
      expectResultOk(result);
    });

    // Alle sollten korrekte Entries zurückgeben
    results.forEach((result, index) => {
      if (!result.ok) {
        throw new Error("Result should be ok");
      }
      const expectedId = `entry-${index % 10}`;
      expect(result.value?.id).toBe(expectedId);
    });
  });
});
