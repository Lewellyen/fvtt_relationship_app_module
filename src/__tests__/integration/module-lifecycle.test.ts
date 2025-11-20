/* eslint-disable @typescript-eslint/no-explicit-any */
// Test file: `any` needed for mocking Foundry global objects (game, Hooks, ui)

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { withFoundryGlobals } from "@/test/utils/test-helpers";
import { createMockGame, createMockHooks, createMockUI } from "@/test/mocks/foundry";
import { MODULE_CONSTANTS } from "@/infrastructure/shared/constants";

describe("Integration: Module Lifecycle", () => {
  let cleanup: (() => void) | undefined;

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    cleanup?.();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("should handle module lifecycle (init → ready)", async () => {
    // 1. Setup
    const mockGame = createMockGame({ version: "13.350" });
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
    await import("@/framework/core/init-solid");

    // 3. Hook-Callbacks extrahieren
    const hooksOnMock = (global as any).Hooks.on as ReturnType<typeof vi.fn>;

    const initCall = hooksOnMock.mock.calls.find(
      ([hookName]) => hookName === MODULE_CONSTANTS.HOOKS.INIT
    );
    const initCallback = initCall?.[1] as (() => void) | undefined;

    const readyCall = hooksOnMock.mock.calls.find(
      ([hookName]) => hookName === MODULE_CONSTANTS.HOOKS.READY
    );
    const readyCallback = readyCall?.[1] as (() => void) | undefined;

    expect(initCallback).toBeDefined();
    expect(readyCallback).toBeDefined();

    // 4. init Hook feuern
    initCallback!();

    // Prüfen dass API exponiert wurde
    expect(mockModule.api).toBeDefined();
    expect(typeof (mockModule.api as any)?.resolve).toBe("function");
    expect(typeof (mockModule.api as any)?.getAvailableTokens).toBe("function");
    expect(typeof (mockModule.api as any)?.getMetrics).toBe("function");

    // Prüfen dass Settings registriert wurden
    const gameSettings = (global as any).game.settings;
    if (gameSettings && gameSettings.register) {
      expect(gameSettings.register).toHaveBeenCalled();
    }

    // Prüfen dass Hooks registriert wurden
    const renderJournalCall = hooksOnMock.mock.calls.find(
      ([hookName]) => hookName === MODULE_CONSTANTS.HOOKS.RENDER_JOURNAL_DIRECTORY
    );
    expect(renderJournalCall).toBeDefined();

    const updateJournalCall = hooksOnMock.mock.calls.find(
      ([hookName]) => hookName === MODULE_CONSTANTS.HOOKS.UPDATE_JOURNAL_ENTRY
    );
    expect(updateJournalCall).toBeDefined();

    // 5. ready Hook feuern
    readyCallback!();

    // Prüfen dass Services bereit sind (Container sollte funktionieren)
    const mod = (global as any).game.modules.get(MODULE_CONSTANTS.MODULE.ID);
    expect(mod.api).toBeDefined();

    // Container sollte funktionieren (kann Services resolven)
    // Verwende API-safe Token (journalVisibilityServiceToken)
    const journalService = mod.api.resolve(mod.api.tokens.journalVisibilityServiceToken);
    expect(journalService).toBeDefined();
  });
});
