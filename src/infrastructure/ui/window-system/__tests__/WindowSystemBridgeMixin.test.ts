/**
 * Unit Tests für JournalEntryPageWindowSystemBridgeMixin
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

const mockModule = {
  api: {
    resolve: vi.fn(),
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
    frame.className = "window-content";
    return frame;
  }

  async close(_options?: unknown): Promise<this> {
    return this;
  }
}

describe("JournalEntryPageWindowSystemBridgeMixin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // @ts-expect-error - Mock game global
    globalThis.game = mockGame;
    mockGame.modules.get.mockReturnValue(mockModule);
  });

  it("should create a mixin class that extends BaseSheet", () => {
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

    expect(MixedSheet).toBeDefined();
    expect(MixedSheet.prototype).toBeInstanceOf(Object);
  });

  it("should have api getter that accesses module API", () => {
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

    // Access api getter (should call game.modules.get)
    expect(() => {
      // @ts-expect-error - Access private getter for testing
      const api = instance.api;
      expect(api).toBe(mockModule.api);
    }).not.toThrow();

    expect(mockGame.modules.get).toHaveBeenCalled();
  });

  it("should throw error if module API is not available", () => {
    mockGame.modules.get.mockReturnValue(null);

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

    expect(() => {
      // @ts-expect-error - Access private getter for testing
      const _api = instance.api;
    }).toThrow("Module API not available");
  });

  it("should throw error if game API is not available", () => {
    // @ts-expect-error - Remove game global
    delete globalThis.game;

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

    expect(() => {
      // @ts-expect-error - Access private getter for testing
      const _api = instance.api;
    }).toThrow("Foundry game API not available");
  });

  it("should have resolveService method", () => {
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

    const mockService = { test: "service" };
    mockModule.api.resolve.mockReturnValue(mockService);

    // @ts-expect-error - Access protected method for testing
    const service = instance.resolveService(mockModule.api.tokens.notificationCenterToken);
    expect(service).toBe(mockService);
    expect(mockModule.api.resolve).toHaveBeenCalledWith(
      mockModule.api.tokens.notificationCenterToken
    );
  });

  it("should have resolveServiceWithError method", () => {
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

    const mockService = { test: "service" };
    const mockResult = { ok: true, value: mockService };
    mockModule.api.resolveWithError.mockReturnValue(mockResult);

    // @ts-expect-error - Access protected method for testing
    const result = instance.resolveServiceWithError(mockModule.api.tokens.notificationCenterToken);
    expect(result).toBe(mockResult);
    expect(mockModule.api.resolveWithError).toHaveBeenCalledWith(
      mockModule.api.tokens.notificationCenterToken
    );
  });
});
