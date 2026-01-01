// Test file: `any` needed for mocking Foundry global objects (game, Hooks, ui)

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { withFoundryGlobals } from "@/test/utils/test-helpers";
import { createMockGame, createMockHooks, createMockUI } from "@/test/mocks/foundry";
import { MODULE_METADATA } from "@/application/constants/app-constants";
import { DOMAIN_EVENTS } from "@/domain/constants/domain-constants";
import type { JournalVisibilityService } from "@/application/services/JournalVisibilityService";
import type { JournalDirectoryProcessor } from "@/application/services/JournalDirectoryProcessor";

describe("Integration: Hook Registration + Execution", () => {
  let cleanup: (() => void) | undefined;

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    cleanup?.();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("should register hook and execute callback when Foundry hook fires", async () => {
    // 1. Setup
    const mockGame = createMockGame({ version: "13.350" });
    const mockHooks = createMockHooks();

    // game.modules für init-solid benötigt
    const mockModule = {
      api: undefined as unknown,
    };
    if (mockGame.modules) {
      mockGame.modules.set(MODULE_METADATA.ID, mockModule as any);
    }

    cleanup = withFoundryGlobals({
      game: mockGame,
      Hooks: mockHooks,
      ui: createMockUI(),
    });

    // 2. init-solid importieren (triggert Bootstrap und Hook-Registrierung)
    await import("@/framework/core/init-solid");

    // 3. Hook-Mock holen
    const hooksOnMock = (global as any).Hooks.on as ReturnType<typeof vi.fn>;

    // 4. init Hook feuern, damit Hooks registriert werden
    const initCall = hooksOnMock.mock.calls.find(([hookName]) => hookName === DOMAIN_EVENTS.INIT);
    const initCallback = initCall?.[1] as (() => void) | undefined;
    expect(initCallback).toBeDefined();
    initCallback!();

    // 5. Prüfen dass Hook registriert wurde (nach init Hook)
    expect(hooksOnMock).toHaveBeenCalledWith(
      DOMAIN_EVENTS.RENDER_JOURNAL_DIRECTORY,
      expect.any(Function)
    );

    // 6. Services spyen (JournalVisibilityService + JournalDirectoryProcessor)
    // Container direkt holen (nicht über API, da platformJournalDirectoryUiPortToken nicht API-safe ist)
    const { getRootContainer } = await import("@/framework/core/init-solid");
    const { journalVisibilityServiceToken } =
      await import("@/application/tokens/application.tokens");
    const { journalDirectoryProcessorToken } =
      await import("@/application/tokens/application.tokens");
    const { castResolvedService } =
      await import("@/infrastructure/di/types/utilities/runtime-safe-cast");

    const containerResult = getRootContainer();
    expect(containerResult.ok).toBe(true);
    if (!containerResult.ok) return;
    const container = containerResult.value;

    // journalVisibilityServiceToken
    const journalServiceResult = container.resolveWithError(journalVisibilityServiceToken);
    expect(journalServiceResult.ok).toBe(true);
    if (!journalServiceResult.ok) return;
    const journalService = castResolvedService<JournalVisibilityService>(
      journalServiceResult.value
    );
    const getHiddenJournalEntriesSpy = vi.spyOn(journalService, "getHiddenJournalEntries");

    // journalDirectoryProcessorToken
    const directoryProcessorResult = container.resolveWithError(journalDirectoryProcessorToken);
    expect(directoryProcessorResult.ok).toBe(true);
    if (!directoryProcessorResult.ok) return;
    const directoryProcessor = castResolvedService<JournalDirectoryProcessor>(
      directoryProcessorResult.value
    );
    const processDirectorySpy = vi.spyOn(directoryProcessor, "processDirectory");

    // 7. Hook-Callback extrahieren
    const renderCall = hooksOnMock.mock.calls.find(
      ([hookName]) => hookName === DOMAIN_EVENTS.RENDER_JOURNAL_DIRECTORY
    );
    const renderCallback = renderCall?.[1] as ((app: any, html: HTMLElement) => void) | undefined;

    expect(renderCallback).toBeDefined();

    // 8. Hook manuell feuern
    const mockApp = {
      id: "journal",
      object: {},
      options: {},
    };
    const mockHtml = document.createElement("div");
    renderCallback!(mockApp, mockHtml);

    // 9. Prüfen ob Service-Methoden aufgerufen wurden
    expect(getHiddenJournalEntriesSpy).toHaveBeenCalled();
    expect(processDirectorySpy).toHaveBeenCalledWith(
      "journal",
      expect.any(Array) // hidden entries array
    );
  });
});
