import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("index.ts", () => {
  beforeEach(() => {
    // Mock Foundry globals before module import
    vi.stubGlobal("game", { version: "13.291" });
    vi.stubGlobal("Hooks", {
      on: vi.fn(),
      off: vi.fn(),
    });
    // Mock foundry global for DataModel/Sheet classes
    vi.stubGlobal("foundry", {
      abstract: {
        TypeDataModel: class {},
      },
      applications: {
        apps: {
          DocumentSheetConfig: {
            registerSheet: vi.fn(),
          },
        },
        sheets: {
          journal: {
            JournalEntryPageHandlebarsSheet: class {},
          },
        },
      },
      data: {
        fields: {},
      },
    });
    vi.stubGlobal("CONFIG", {
      JournalEntryPage: {
        dataModels: {},
      },
    });
    vi.stubGlobal("JournalEntryPage", class {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("should import without errors", async () => {
    // index.ts führt init-solid aus, das global bootstrappt
    await expect(import("../framework/index")).resolves.toBeDefined();
  });
});
