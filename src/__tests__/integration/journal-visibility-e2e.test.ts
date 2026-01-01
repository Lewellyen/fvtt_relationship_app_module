// Test file: `any` needed for mocking Foundry global objects (game, Hooks, ui)

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { withFoundryGlobals } from "@/test/utils/test-helpers";
import { createMockGame, createMockHooks, createMockUI } from "@/test/mocks/foundry";
import { createMockJournalEntry } from "@/test/mocks/foundry";
import { MODULE_METADATA } from "@/application/constants/app-constants";
import { DOMAIN_EVENTS } from "@/domain/constants/domain-constants";

describe("Integration: Journal Visibility End-to-End", () => {
  let cleanup: (() => void) | undefined;

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    cleanup?.();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("should hide journal entry in complete workflow", async () => {
    // 1. Setup Foundry Globals
    const mockGame = createMockGame({ version: "13.350" });
    const mockHooks = createMockHooks();

    // Journal Entry mit Flag erstellen
    // Flag muss im Format "scope.key" gesetzt werden für getFlag()
    const mockEntry = createMockJournalEntry({
      id: "test-entry-123",
      name: "Hidden Entry",
      flags: {
        [`${MODULE_METADATA.ID}.hidden`]: true,
      },
    });

    // Journal Directory DOM erstellen (Foundry verwendet li.directory-item)
    // getDirectoryElement sucht nach #journal im document, daher muss das Element im document sein
    const journalContainer = document.createElement("div");
    journalContainer.id = "journal";
    const listItem = document.createElement("li");
    listItem.className = "directory-item";
    listItem.setAttribute("data-entry-id", mockEntry.id);
    const heading = document.createElement("h4");
    heading.textContent = mockEntry.name;
    listItem.appendChild(heading);
    journalContainer.appendChild(listItem);
    document.body.appendChild(journalContainer);

    // game.journal mocken
    if (mockGame.journal) {
      mockGame.journal.get = vi.fn().mockReturnValue(mockEntry);
      mockGame.journal.contents = [mockEntry];
    }

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

    // 3. init Hook feuern, damit Hooks registriert werden
    const hooksOnMock = (global as any).Hooks.on as ReturnType<typeof vi.fn>;
    const initCall = hooksOnMock.mock.calls.find(([hookName]) => hookName === DOMAIN_EVENTS.INIT);
    const initCallback = initCall?.[1] as (() => void) | undefined;
    expect(initCallback).toBeDefined();
    initCallback!();

    // 4. Hook-Callback extrahieren (renderJournalDirectory)
    const renderCall = hooksOnMock.mock.calls.find(
      ([hookName]) => hookName === DOMAIN_EVENTS.RENDER_JOURNAL_DIRECTORY
    );
    const renderCallback = renderCall?.[1] as ((app: any, html: HTMLElement) => void) | undefined;

    expect(renderCallback).toBeDefined();

    // getDirectoryElement is no longer part of PlatformJournalDirectoryUiPort
    // removeJournalDirectoryEntry handles directory element fetching internally

    // 5. Hook manuell feuern (simuliert Foundry Hook)
    // Mock-App für renderJournalDirectory Hook (id muss "journal" sein für getDirectoryElement)
    const mockApp = {
      id: "journal",
      object: {},
      options: {},
    };
    renderCallback!(mockApp, journalContainer);

    // 6. Prüfen ob Entry versteckt ist
    // processJournalDirectory sollte das Element entfernt haben
    const hiddenElement = journalContainer.querySelector(
      `li.directory-item[data-entry-id="${mockEntry.id}"]`
    );
    expect(hiddenElement).toBeNull(); // Entry sollte nicht im DOM sein

    // Cleanup
    document.body.removeChild(journalContainer);
  });

  it("should keep visible journal entry visible", async () => {
    // 1. Setup Foundry Globals
    const mockGame = createMockGame({ version: "13.350" });
    const mockHooks = createMockHooks();

    // Journal Entry OHNE hidden Flag erstellen
    const mockEntry = createMockJournalEntry({
      id: "test-entry-456",
      name: "Visible Entry",
      flags: {
        [`${MODULE_METADATA.ID}.hidden`]: false,
      },
    });

    // Journal Directory DOM erstellen (Foundry verwendet li.directory-item)
    // getDirectoryElement sucht nach #journal im document, daher muss das Element im document sein
    const journalContainer = document.createElement("div");
    journalContainer.id = "journal";
    const listItem = document.createElement("li");
    listItem.className = "directory-item";
    listItem.setAttribute("data-entry-id", mockEntry.id);
    const heading = document.createElement("h4");
    heading.textContent = mockEntry.name;
    listItem.appendChild(heading);
    journalContainer.appendChild(listItem);
    document.body.appendChild(journalContainer);

    // game.journal mocken
    if (mockGame.journal) {
      mockGame.journal.get = vi.fn().mockReturnValue(mockEntry);
      mockGame.journal.contents = [mockEntry];
    }

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

    // 3. init Hook feuern, damit Hooks registriert werden
    const hooksOnMock = (global as any).Hooks.on as ReturnType<typeof vi.fn>;
    const initCall = hooksOnMock.mock.calls.find(([hookName]) => hookName === DOMAIN_EVENTS.INIT);
    const initCallback = initCall?.[1] as (() => void) | undefined;
    expect(initCallback).toBeDefined();
    initCallback!();

    // 4. Hook-Callback extrahieren
    const renderCall = hooksOnMock.mock.calls.find(
      ([hookName]) => hookName === DOMAIN_EVENTS.RENDER_JOURNAL_DIRECTORY
    );
    const renderCallback = renderCall?.[1] as ((app: any, html: HTMLElement) => void) | undefined;

    expect(renderCallback).toBeDefined();

    // 5. Hook manuell feuern
    const mockApp = {
      id: "journal",
      object: {},
      options: {},
    };
    renderCallback!(mockApp, journalContainer);

    // 6. Prüfen ob Entry sichtbar bleibt
    const visibleElement = journalContainer.querySelector(
      `li.directory-item[data-entry-id="${mockEntry.id}"]`
    );
    expect(visibleElement).not.toBeNull(); // Entry sollte im DOM bleiben

    // Cleanup
    document.body.removeChild(journalContainer);
  });
});
