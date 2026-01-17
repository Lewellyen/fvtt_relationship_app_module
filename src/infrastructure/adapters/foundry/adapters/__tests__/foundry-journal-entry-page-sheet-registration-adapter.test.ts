import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { FoundryJournalEntryPageSheetRegistrationAdapter } from "../foundry-journal-entry-page-sheet-registration-adapter";

describe("FoundryJournalEntryPageSheetRegistrationAdapter", () => {
  const originalFoundry = (globalThis as any).foundry;
  const originalGame = (globalThis as any).game;
  const originalConfig = (globalThis as any).CONFIG;
  const originalJournalEntryPage = (globalThis as any).JournalEntryPage;

  beforeEach(() => {
    (globalThis as any).CONFIG = { JournalEntryPage: { dataModels: {} } };
    class JournalEntryPageMock {}
    (globalThis as any).JournalEntryPage = JournalEntryPageMock as any;
    (globalThis as any).game = { i18n: { localize: vi.fn(() => "X") } };

    const registerSheet = vi.fn();
    (globalThis as any).foundry = {
      applications: { apps: { DocumentSheetConfig: { registerSheet } } },
    };
  });

  afterEach(() => {
    (globalThis as any).foundry = originalFoundry;
    (globalThis as any).game = originalGame;
    (globalThis as any).CONFIG = originalConfig;
    (globalThis as any).JournalEntryPage = originalJournalEntryPage;
  });

  it("should register dataModels and sheets", () => {
    const adapter = new FoundryJournalEntryPageSheetRegistrationAdapter();
    const result = adapter.registerSheetsAndDataModels();
    expect(result.ok).toBe(true);

    const dm = (globalThis as any).CONFIG.JournalEntryPage.dataModels;
    expect(Object.keys(dm).length).toBeGreaterThan(0);

    const registerSheet = (globalThis as any).foundry.applications.apps.DocumentSheetConfig
      .registerSheet as ReturnType<typeof vi.fn>;
    expect(registerSheet).toHaveBeenCalled();

    // Cover label functions (i18n path)
    const calls = registerSheet.mock.calls;
    const label1 = calls[0]?.[3]?.label?.() as string;
    const label2 = calls[1]?.[3]?.label?.() as string;
    expect(label1).toBe("X");
    expect(label2).toBe("X");
  });

  it("should fall back to default labels when i18n is not available", () => {
    (globalThis as any).game = undefined;

    const adapter = new FoundryJournalEntryPageSheetRegistrationAdapter();
    const result = adapter.registerSheetsAndDataModels();
    expect(result.ok).toBe(true);

    const registerSheet = (globalThis as any).foundry.applications.apps.DocumentSheetConfig
      .registerSheet as ReturnType<typeof vi.fn>;
    const calls = registerSheet.mock.calls;
    const label1 = calls[0]?.[3]?.label?.() as string;
    const label2 = calls[1]?.[3]?.label?.() as string;
    expect(label1).toBe("Beziehungsknoten");
    expect(label2).toBe("Beziehungsgraph");
  });
});
