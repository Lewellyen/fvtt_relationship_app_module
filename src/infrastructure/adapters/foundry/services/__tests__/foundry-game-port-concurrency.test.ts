/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { FoundryGamePort } from "@/infrastructure/adapters/foundry/services/FoundryGamePort";
import type { FoundryGame } from "@/infrastructure/adapters/foundry/interfaces/FoundryGame";
import { PortRegistry } from "@/infrastructure/adapters/foundry/versioning/portregistry";
import { PortSelector } from "@/infrastructure/adapters/foundry/versioning/portselector";
import { ok } from "@/domain/utils/result";
import { expectResultOk } from "@/test/utils/test-helpers";
import { PortSelectionEventEmitter } from "@/infrastructure/adapters/foundry/versioning/port-selection-events";
import type { ObservabilityRegistry } from "@/infrastructure/observability/observability-registry";
import type { RetryService } from "@/infrastructure/retry/RetryService";
import type { ServiceContainer } from "@/infrastructure/di/container";
import type { InjectionToken } from "@/infrastructure/di/types/core/injectiontoken";
import { createInjectionToken } from "@/infrastructure/di/token-factory";
import { createMockJournalEntry } from "@/test/mocks/foundry";
import type { FoundryJournalEntry } from "@/infrastructure/adapters/foundry/types";

describe("Concurrency: Journal Access", () => {
  let service: FoundryGamePort;
  let mockRegistry: PortRegistry<FoundryGame>;
  let mockSelector: PortSelector;
  let mockPort: FoundryGame;
  let mockRetryService: RetryService;
  let mockEntries: FoundryJournalEntry[];
  let mockContainer: ServiceContainer;
  const mockToken = createInjectionToken<FoundryGame>("mock-port");

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

    const mockEventEmitter = new PortSelectionEventEmitter();
    const mockObservability: ObservabilityRegistry = {
      registerPortSelector: vi.fn(),
    } as any;
    mockSelector = new PortSelector(mockEventEmitter, mockObservability, mockContainer);
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
