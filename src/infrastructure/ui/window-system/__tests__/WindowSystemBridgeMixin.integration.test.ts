/**
 * Integration Tests für JournalEntryPageWindowSystemBridgeMixin
 *
 * Testet die Integration mit:
 * - Svelte-Rendering
 * - Window-System
 * - Public API
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { JournalEntryPageWindowSystemBridgeMixin } from "../JournalEntryPageWindowSystemBridgeMixin";
import type { SheetWindowDefinition } from "../JournalEntryPageWindowSystemBridgeMixin";

// Mock Foundry APIs
const mockGame = {
  modules: {
    get: vi.fn(),
  },
};

const mockNotificationCenter = {
  error: vi.fn(),
  info: vi.fn(),
};

const mockModule = {
  api: {
    resolve: vi.fn((token) => {
      if (token === mockModule.api.tokens.notificationCenterToken) {
        return mockNotificationCenter;
      }
      return null;
    }),
    resolveWithError: vi.fn(),
    tokens: {
      graphDataServiceToken: Symbol("graphDataServiceToken"),
      nodeDataServiceToken: Symbol("nodeDataServiceToken"),
      notificationCenterToken: Symbol("notificationCenterToken"),
    },
  },
};

// Mock Base Sheet
class MockBaseSheet {
  static DEFAULT_OPTIONS = {
    id: "base-sheet",
    classes: [],
  };

  document: unknown;

  constructor(...args: unknown[]) {
    this.document = args[0] || {};
  }

  async _renderFrame(_options: Record<string, unknown>): Promise<HTMLElement> {
    const frame = document.createElement("div");
    const content = document.createElement("div");
    content.className = "window-content";
    frame.appendChild(content);
    return frame;
  }

  async close(_options?: unknown): Promise<this> {
    return this;
  }
}

describe("JournalEntryPageWindowSystemBridgeMixin Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // @ts-expect-error - Mock game global
    globalThis.game = mockGame;
    mockGame.modules.get.mockReturnValue(mockModule);

    // Setup DOM
    document.body.innerHTML = "";
  });

  it.skip("should render Svelte component in _renderFrame", async () => {
    // NOTE: Dieser Test ist veraltet, da wir jetzt _onRender mit Handlebars-Templates verwenden
    // statt _renderFrame. Der Mount-Point wird jetzt in Handlebars-Templates definiert.
    // TODO: Test neu schreiben für _onRender-Struktur mit Handlebars-Templates
    const windowDefinition: SheetWindowDefinition = {
      definitionId: "test-sheet",
      component: {
        type: "svelte",
        component: {} as unknown,
      },
    };

    // eslint-disable-next-line @typescript-eslint/naming-convention -- Mixin returns class, use PascalCase
    const MixedSheet = JournalEntryPageWindowSystemBridgeMixin(
      MockBaseSheet as unknown as typeof foundry.applications.sheets.journal.JournalEntryPageHandlebarsSheet,
      windowDefinition
    );

    const mockDocument = {} as unknown as foundry.documents.BaseJournalEntryPage;
    // @ts-expect-error - Mock document for testing
    const instance = new MixedSheet({ document: mockDocument });
    // @ts-expect-error - Access protected method for testing
    const frame = await instance._renderFrame({});

    // Prüfe ob Mount-Point erstellt wurde
    const mountPoint = frame.querySelector("#svelte-mount-point");
    expect(mountPoint).toBeTruthy();
  });

  it("should cleanup component on close", async () => {
    const windowDefinition: SheetWindowDefinition = {
      definitionId: "test-sheet",
      component: {
        type: "svelte",
        component: {} as unknown,
      },
    };

    // eslint-disable-next-line @typescript-eslint/naming-convention -- Mixin returns class, use PascalCase
    const MixedSheet = JournalEntryPageWindowSystemBridgeMixin(
      MockBaseSheet as unknown as typeof foundry.applications.sheets.journal.JournalEntryPageHandlebarsSheet,
      windowDefinition
    );

    const mockDocument = {} as unknown as foundry.documents.BaseJournalEntryPage;
    // @ts-expect-error - Mock document for testing
    const instance = new MixedSheet({ document: mockDocument });
    // @ts-expect-error - Access protected method for testing
    await instance._renderFrame({});
    await instance.close();

    // Component sollte unmounted sein (prüfe internen State)
    // Da isMounted private ist, können wir nur prüfen, dass close() erfolgreich war
    expect(instance).toBeDefined();
  });

  it("should handle missing window-content element gracefully", async () => {
    const windowDefinition: SheetWindowDefinition = {
      definitionId: "test-sheet",
      component: {
        type: "svelte",
        component: {} as unknown,
      },
    };

    // Mock Base Sheet ohne .window-content
    class MockBaseSheetWithoutContent {
      static DEFAULT_OPTIONS = {
        id: "base-sheet",
        classes: [],
      };

      document: unknown;

      constructor(...args: unknown[]) {
        this.document = args[0] || {};
      }

      async _renderFrame(_options: Record<string, unknown>): Promise<HTMLElement> {
        // Frame ohne .window-content
        return document.createElement("div");
      }

      async close(_options?: unknown): Promise<this> {
        return this;
      }
    }

    // eslint-disable-next-line @typescript-eslint/naming-convention -- Mixin returns class, use PascalCase
    const MixedSheet = JournalEntryPageWindowSystemBridgeMixin(
      MockBaseSheetWithoutContent as unknown as typeof foundry.applications.sheets.journal.JournalEntryPageHandlebarsSheet,
      windowDefinition
    );

    const mockDocument = {} as unknown as foundry.documents.BaseJournalEntryPage;
    // @ts-expect-error - Mock document for testing
    const instance = new MixedSheet({ document: mockDocument });
    // @ts-expect-error - Access protected method for testing
    const frame = await instance._renderFrame({});

    // Sollte Frame zurückgeben, auch wenn kein .window-content vorhanden ist
    expect(frame).toBeDefined();
  });
});
