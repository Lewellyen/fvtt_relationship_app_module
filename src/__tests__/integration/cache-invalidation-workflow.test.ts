/* eslint-disable @typescript-eslint/no-explicit-any */
// Test file: `any` needed for mocking Foundry global objects (game, Hooks, ui)

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { withFoundryGlobals } from "@/test/utils/test-helpers";
import { createMockGame, createMockHooks, createMockUI } from "@/test/mocks/foundry";
import { createMockJournalEntry } from "@/test/mocks/foundry";
import { MODULE_CONSTANTS } from "@/constants";
import { HIDDEN_JOURNAL_CACHE_TAG } from "@/services/JournalVisibilityService";
import type { CacheService, CacheKey, CacheEntryMetadata } from "@/interfaces/cache";
import { createCacheNamespace } from "@/interfaces/cache";
import { expectResultOk } from "@/test/utils/test-helpers";

describe("Integration: Cache Invalidation Workflow", () => {
  let cleanup: (() => void) | undefined;

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    cleanup?.();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("should invalidate cache when journal entry is updated", async () => {
    // 1. Setup
    // Journal Entry mit Flag erstellen
    // Flag muss im Format "scope.key" gesetzt werden für getFlag()
    const mockEntry = createMockJournalEntry({
      id: "test-entry-123",
      name: "Test Entry",
      flags: {
        [`${MODULE_CONSTANTS.MODULE.ID}.hidden`]: true,
      },
    });

    const mockGame = createMockGame({ version: "13.350" });
    if (mockGame.journal) {
      mockGame.journal.get = vi.fn().mockReturnValue(mockEntry);
      mockGame.journal.contents = [mockEntry];
    }

    // game.modules für init-solid benötigt
    const mockModule = {
      api: undefined as unknown,
    };
    if (mockGame.modules) {
      mockGame.modules.set(MODULE_CONSTANTS.MODULE.ID, mockModule as any);
    }

    // game.settings für Settings-Registrierung benötigt
    const gameWithSettings = {
      ...mockGame,
      settings: {
        get: vi.fn(),
        set: vi.fn(),
        register: vi.fn(),
      },
    };

    cleanup = withFoundryGlobals({
      game: gameWithSettings as any,
      Hooks: createMockHooks(),
      ui: createMockUI(),
    });

    // 2. init-solid importieren (triggert Bootstrap)
    await import("@/core/init-solid");

    // 3. init Hook feuern (registriert Hooks)
    const hooksOnMock = (global as any).Hooks.on as ReturnType<typeof vi.fn>;
    const initCall = hooksOnMock.mock.calls.find(
      ([hookName]) => hookName === MODULE_CONSTANTS.HOOKS.INIT
    );
    const initCallback = initCall?.[1] as (() => void) | undefined;
    expect(initCallback).toBeDefined();
    initCallback!();

    // 4. Container aus init-solid.ts holen (gleicher Container wie der Hook verwendet)
    // WICHTIG: Token dynamisch importieren nach vi.resetModules() um sicherzustellen,
    // dass wir die gleichen Symbol-Instanzen verwenden
    const { cacheServiceToken, journalVisibilityServiceToken } = await import(
      "@/tokens/tokenindex"
    );
    const { getRootContainer } = await import("@/core/init-solid");

    const containerResult = getRootContainer();
    expectResultOk(containerResult);
    const container = containerResult.value;

    // journalVisibilityServiceToken ist API-safe, aber für Konsistenz über Container resolven
    const journalServiceResult = container.resolveWithError(journalVisibilityServiceToken);
    expectResultOk(journalServiceResult);
    const journalService = journalServiceResult.value;

    // cacheServiceToken ist nicht API-safe, daher Container direkt verwenden
    const cacheServiceResult = container.resolveWithError(cacheServiceToken);
    expectResultOk(cacheServiceResult);
    const cacheService = cacheServiceResult.value as CacheService;

    // 5. Cache mit Entry füllen (via getHiddenJournalEntries)
    const hiddenResult = journalService.getHiddenJournalEntries();
    expectResultOk(hiddenResult);
    expect(hiddenResult.value.length).toBeGreaterThan(0);

    // Prüfen dass Entry im Cache ist
    const buildCacheKey = createCacheNamespace("journal-visibility");
    const cacheKey: CacheKey = buildCacheKey("hidden-directory");
    const cacheGetResult = cacheService.get(cacheKey);
    expect(cacheGetResult).toBeDefined();

    // 6. Hook-Callback extrahieren (updateJournalEntry)
    const updateCall = hooksOnMock.mock.calls.find(
      ([hookName]) => hookName === MODULE_CONSTANTS.HOOKS.UPDATE_JOURNAL_ENTRY
    );
    const updateCallback = updateCall?.[1] as ((entry: any) => void) | undefined;

    expect(updateCallback).toBeDefined();

    // Spy auf invalidateWhere setzen
    const invalidateWhereSpy = vi.spyOn(cacheService, "invalidateWhere");

    // 7. Entry updaten (simuliert Foundry Update)
    const updatedEntry = { ...mockEntry, name: "Updated Entry" };
    if (mockGame.journal) {
      mockGame.journal.get = vi.fn().mockReturnValue(updatedEntry);
    }

    // 8. Hook manuell feuern
    updateCallback!(updatedEntry);

    // 9. Prüfen ob Cache invalidiert wurde
    expect(invalidateWhereSpy).toHaveBeenCalled();
    const predicate = invalidateWhereSpy.mock.calls[0]?.[0];
    expect(predicate).toBeDefined();
    if (predicate) {
      // Prüfen dass Predicate auf journal:hidden Tag prüft
      const testMeta: CacheEntryMetadata = {
        key: buildCacheKey("test"),
        tags: [HIDDEN_JOURNAL_CACHE_TAG],
        createdAt: Date.now(),
        expiresAt: Date.now() + 1000,
        lastAccessedAt: Date.now(),
        hits: 0,
      };
      expect(predicate(testMeta)).toBe(true);
    }
  });
});
