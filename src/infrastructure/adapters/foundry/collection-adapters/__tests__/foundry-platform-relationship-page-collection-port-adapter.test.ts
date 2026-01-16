import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  FoundryPlatformRelationshipPageCollectionPortAdapter,
  DIFoundryPlatformRelationshipPageCollectionPortAdapter,
} from "../foundry-platform-relationship-page-collection-port-adapter";
import type { RelationshipPageCollectionAdapter } from "../relationship-page-collection-adapter.interface";
import type { FoundryJournalEntryPage } from "@/infrastructure/adapters/foundry/types";
import type { EntityCollectionError } from "@/domain/ports/collections/entity-collection-error.interface";
import { JOURNAL_PAGE_SHEET_TYPE } from "@/application/constants/app-constants";
import { ok, err } from "@/domain/utils/result";

function createFoundryPage(overrides: Record<string, unknown>): FoundryJournalEntryPage {
  return {
    id: "page-1",
    type: JOURNAL_PAGE_SHEET_TYPE.RELATIONSHIP_GRAPH,
    ...overrides,
  } as unknown as FoundryJournalEntryPage;
}

describe("FoundryPlatformRelationshipPageCollectionPortAdapter", () => {
  let mockAdapter: RelationshipPageCollectionAdapter;
  let port: FoundryPlatformRelationshipPageCollectionPortAdapter;

  beforeEach(() => {
    mockAdapter = {
      findPagesByType: vi.fn(),
      findNodePages: vi.fn(),
      findGraphPages: vi.fn(),
      findPagesByJournalEntry: vi.fn(),
      findNodePagesByJournalEntry: vi.fn(),
      findGraphPagesByJournalEntry: vi.fn(),
    };
    port = new FoundryPlatformRelationshipPageCollectionPortAdapter(mockAdapter);
  });

  it("should convert pages with correct type and journalId sources", async () => {
    const pages = [
      createFoundryPage({
        id: "page-parent",
        type: JOURNAL_PAGE_SHEET_TYPE.RELATIONSHIP_NODE,
        parent: { id: "journal-parent" },
      }),
      createFoundryPage({
        id: "page-journal-id",
        type: JOURNAL_PAGE_SHEET_TYPE.RELATIONSHIP_GRAPH,
        journalId: "journal-id",
      }),
      createFoundryPage({
        id: "page-journal",
        type: "unknown",
        journal: { id: "journal-nested" },
      }),
      createFoundryPage({
        id: "page-none",
        type: "unknown",
      }),
    ];

    vi.mocked(mockAdapter.findPagesByType).mockResolvedValue(ok(pages));

    const result = await port.findPagesByType("node");

    expect(result.ok).toBe(true);
    if (result.ok) {
      const byId = (id: string) => result.value.find((page) => page.id === id);
      expect(byId("page-parent")?.type).toBe("node");
      expect(byId("page-parent")?.journalId).toBe("journal-parent");
      expect(byId("page-journal-id")?.type).toBe("graph");
      expect(byId("page-journal-id")?.journalId).toBe("journal-id");
      expect(byId("page-journal")?.type).toBe("graph");
      expect(byId("page-journal")?.journalId).toBe("journal-nested");
      expect(byId("page-none")?.type).toBe("graph");
      expect(byId("page-none")?.journalId).toBe("");
    }
  });

  it("should map node pages", async () => {
    const pages = [
      createFoundryPage({
        id: "page-node",
        type: JOURNAL_PAGE_SHEET_TYPE.RELATIONSHIP_NODE,
        parent: { id: "journal-1" },
      }),
    ];
    vi.mocked(mockAdapter.findNodePages).mockResolvedValue(ok(pages));

    const result = await port.findNodePages();

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value[0]?.journalId).toBe("journal-1");
      expect(result.value[0]?.type).toBe("node");
    }
  });

  it("should map node pages when journalId is provided", async () => {
    const pages = [
      createFoundryPage({
        id: "page-node-journal-id",
        type: JOURNAL_PAGE_SHEET_TYPE.RELATIONSHIP_NODE,
        journalId: "journal-node",
      }),
    ];
    vi.mocked(mockAdapter.findNodePages).mockResolvedValue(ok(pages));

    const result = await port.findNodePages();

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value[0]?.journalId).toBe("journal-node");
      expect(result.value[0]?.type).toBe("node");
    }
  });

  it("should map node pages when journal is provided or missing", async () => {
    const pages = [
      createFoundryPage({
        id: "page-node-journal",
        type: JOURNAL_PAGE_SHEET_TYPE.RELATIONSHIP_NODE,
        journal: { id: "journal-nested-node" },
      }),
      createFoundryPage({
        id: "page-node-empty",
        type: JOURNAL_PAGE_SHEET_TYPE.RELATIONSHIP_NODE,
      }),
    ];
    vi.mocked(mockAdapter.findNodePages).mockResolvedValue(ok(pages));

    const result = await port.findNodePages();

    expect(result.ok).toBe(true);
    if (result.ok) {
      const byId = (id: string) => result.value.find((page) => page.id === id);
      expect(byId("page-node-journal")?.journalId).toBe("journal-nested-node");
      expect(byId("page-node-empty")?.journalId).toBe("");
    }
  });

  it("should map graph pages", async () => {
    const pages = [
      createFoundryPage({
        id: "page-graph",
        type: JOURNAL_PAGE_SHEET_TYPE.RELATIONSHIP_GRAPH,
        parent: { id: "journal-2" },
      }),
    ];
    vi.mocked(mockAdapter.findGraphPages).mockResolvedValue(ok(pages));

    const result = await port.findGraphPages();

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value[0]?.journalId).toBe("journal-2");
      expect(result.value[0]?.type).toBe("graph");
    }
  });

  it("should map graph pages when journalId is provided", async () => {
    const pages = [
      createFoundryPage({
        id: "page-graph-journal-id",
        type: JOURNAL_PAGE_SHEET_TYPE.RELATIONSHIP_GRAPH,
        journalId: "journal-graph",
      }),
    ];
    vi.mocked(mockAdapter.findGraphPages).mockResolvedValue(ok(pages));

    const result = await port.findGraphPages();

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value[0]?.journalId).toBe("journal-graph");
      expect(result.value[0]?.type).toBe("graph");
    }
  });

  it("should map graph pages when journal is provided or missing", async () => {
    const pages = [
      createFoundryPage({
        id: "page-graph-journal",
        type: JOURNAL_PAGE_SHEET_TYPE.RELATIONSHIP_GRAPH,
        journal: { id: "journal-nested-graph" },
      }),
      createFoundryPage({
        id: "page-graph-empty",
        type: JOURNAL_PAGE_SHEET_TYPE.RELATIONSHIP_GRAPH,
      }),
    ];
    vi.mocked(mockAdapter.findGraphPages).mockResolvedValue(ok(pages));

    const result = await port.findGraphPages();

    expect(result.ok).toBe(true);
    if (result.ok) {
      const byId = (id: string) => result.value.find((page) => page.id === id);
      expect(byId("page-graph-journal")?.journalId).toBe("journal-nested-graph");
      expect(byId("page-graph-empty")?.journalId).toBe("");
    }
  });

  it("should map pages by journal entry", async () => {
    const pages = [
      createFoundryPage({
        id: "page-by-journal",
        type: JOURNAL_PAGE_SHEET_TYPE.RELATIONSHIP_GRAPH,
      }),
    ];
    vi.mocked(mockAdapter.findPagesByJournalEntry).mockResolvedValue(ok(pages));

    const result = await port.findPagesByJournalEntry("journal-3");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value[0]?.journalId).toBe("journal-3");
    }
  });

  it("should map node pages by journal entry", async () => {
    const pages = [
      createFoundryPage({
        id: "page-node-by-journal",
        type: JOURNAL_PAGE_SHEET_TYPE.RELATIONSHIP_NODE,
      }),
    ];
    vi.mocked(mockAdapter.findNodePagesByJournalEntry).mockResolvedValue(ok(pages));

    const result = await port.findNodePagesByJournalEntry("journal-4");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value[0]?.journalId).toBe("journal-4");
    }
  });

  it("should map graph pages by journal entry", async () => {
    const pages = [
      createFoundryPage({
        id: "page-graph-by-journal",
        type: JOURNAL_PAGE_SHEET_TYPE.RELATIONSHIP_GRAPH,
      }),
    ];
    vi.mocked(mockAdapter.findGraphPagesByJournalEntry).mockResolvedValue(ok(pages));

    const result = await port.findGraphPagesByJournalEntry("journal-5");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value[0]?.journalId).toBe("journal-5");
    }
  });

  it.each([
    ["findPagesByType", () => port.findPagesByType("node"), "findPagesByType"],
    ["findNodePages", () => port.findNodePages(), "findNodePages"],
    ["findGraphPages", () => port.findGraphPages(), "findGraphPages"],
    [
      "findPagesByJournalEntry",
      () => port.findPagesByJournalEntry("journal-6"),
      "findPagesByJournalEntry",
    ],
    [
      "findNodePagesByJournalEntry",
      () => port.findNodePagesByJournalEntry("journal-7"),
      "findNodePagesByJournalEntry",
    ],
    [
      "findGraphPagesByJournalEntry",
      () => port.findGraphPagesByJournalEntry("journal-8"),
      "findGraphPagesByJournalEntry",
    ],
  ])("should return adapter error for %s", async (_, invoke, methodName) => {
    const collectionError: EntityCollectionError = {
      code: "PLATFORM_ERROR",
      message: "Adapter failed",
    };

    const adapterMethod = mockAdapter[
      methodName as keyof RelationshipPageCollectionAdapter
    ] as ReturnType<typeof vi.fn>;
    adapterMethod.mockResolvedValue(err(collectionError));

    const result = await invoke();

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toEqual(collectionError);
    }
  });

  it("should expose DI dependencies", () => {
    expect(DIFoundryPlatformRelationshipPageCollectionPortAdapter.dependencies).toEqual([
      expect.anything(),
    ]);
  });

  it("should construct DI wrapper instance", () => {
    const diAdapter = new DIFoundryPlatformRelationshipPageCollectionPortAdapter(mockAdapter);
    expect(diAdapter).toBeInstanceOf(FoundryPlatformRelationshipPageCollectionPortAdapter);
  });
});
