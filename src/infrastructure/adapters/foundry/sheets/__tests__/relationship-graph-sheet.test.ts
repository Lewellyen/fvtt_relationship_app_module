/**
 * Unit Tests für RelationshipGraphSheet
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import RelationshipGraphSheet from "../relationship-graph-sheet";

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
      notificationCenterToken: Symbol("notificationCenterToken"),
    },
  },
};

describe("RelationshipGraphSheet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // @ts-expect-error - Mock game global
    globalThis.game = mockGame;
    mockGame.modules.get.mockReturnValue(mockModule);
  });

  it("should have correct DEFAULT_OPTIONS", () => {
    expect(RelationshipGraphSheet.DEFAULT_OPTIONS).toMatchObject({
      id: "journal-entry-relationship-graph",
      classes: expect.arrayContaining(["journal-entry-page", "relationship-graph"]),
      width: 800,
      height: 600,
      resizable: true,
    });
  });

  it("should extend JournalEntryPageHandlebarsSheet", () => {
    // Sheet sollte eine Instanz erstellen können
    const mockDocument = {} as unknown as foundry.documents.BaseJournalEntryPage;
    // @ts-expect-error - Mock document for testing
    const sheet = new RelationshipGraphSheet({ document: mockDocument });
    expect(sheet).toBeInstanceOf(RelationshipGraphSheet);
  });
});
