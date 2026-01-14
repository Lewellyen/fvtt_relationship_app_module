/**
 * Unit Tests für RelationshipNodeSheet
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import RelationshipNodeSheet from "../relationship-node-sheet";

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
      nodeDataServiceToken: Symbol("nodeDataServiceToken"),
      notificationCenterToken: Symbol("notificationCenterToken"),
    },
  },
};

describe("RelationshipNodeSheet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // @ts-expect-error - Mock game global
    globalThis.game = mockGame;
    mockGame.modules.get.mockReturnValue(mockModule);
  });

  it("should have correct DEFAULT_OPTIONS", () => {
    expect(RelationshipNodeSheet.DEFAULT_OPTIONS).toMatchObject({
      id: "journal-entry-relationship-node",
      classes: expect.arrayContaining(["journal-entry-page", "relationship-node"]),
      width: 800,
      height: 600,
      resizable: true,
    });
  });

  it("should extend JournalEntryPageHandlebarsSheet", () => {
    // Sheet sollte eine Instanz erstellen können
    const mockDocument = {} as unknown as foundry.documents.BaseJournalEntryPage;
    // @ts-expect-error - Mock document for testing
    const sheet = new RelationshipNodeSheet({ document: mockDocument });
    expect(sheet).toBeInstanceOf(RelationshipNodeSheet);
  });
});
