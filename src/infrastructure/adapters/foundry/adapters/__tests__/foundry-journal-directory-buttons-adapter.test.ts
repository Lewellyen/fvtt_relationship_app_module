import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ok, err } from "@/domain/utils/result";
import { FoundryJournalDirectoryButtonsAdapter } from "../foundry-journal-directory-buttons-adapter";

describe("FoundryJournalDirectoryButtonsAdapter", () => {
  const originalGame = (globalThis as any).game;

  beforeEach(() => {
    (globalThis as any).game = { user: { role: 4 } };
  });

  afterEach(() => {
    (globalThis as any).game = originalGame;
  });

  it("should register hook and inject buttons on render", async () => {
    let capturedHook: ((...args: unknown[]) => void) | null = null;
    const hooks = {
      on: vi.fn((_name: string, cb: (...args: unknown[]) => void) => {
        capturedHook = cb;
        return ok(1);
      }),
    } as any;
    const logger = { error: vi.fn() } as any;

    const onShowAll = vi.fn().mockResolvedValue(undefined);
    const onOverview = vi.fn().mockResolvedValue(undefined);

    const adapter = new FoundryJournalDirectoryButtonsAdapter(hooks, logger);
    const result = adapter.registerButtons({
      shouldShowButtons: () => true,
      onShowAllHiddenJournalsClick: onShowAll,
      onOpenJournalOverviewClick: onOverview,
      showAllButton: {
        title: "t1",
        labelHtml: "<span>all</span>",
        cssClass: "show-all-hidden-journals-button",
      },
      overviewButton: {
        title: "t2",
        labelHtml: "<span>ov</span>",
        cssClass: "journal-overview-button",
      },
    });

    expect(result.ok).toBe(true);
    expect(hooks.on).toHaveBeenCalledOnce();
    expect(capturedHook).toBeTypeOf("function");

    const root = document.createElement("div");
    const header = document.createElement("div");
    header.className = "directory-header";
    const actions = document.createElement("div");
    actions.className = "header-actions action-buttons";
    header.appendChild(actions);
    root.appendChild(header);

    capturedHook!(null, root);

    const allBtn = root.querySelector(".show-all-hidden-journals-button") as HTMLButtonElement;
    const ovBtn = root.querySelector(".journal-overview-button") as HTMLButtonElement;
    expect(allBtn).toBeTruthy();
    expect(ovBtn).toBeTruthy();

    allBtn.click();
    ovBtn.click();

    // allow async handlers to run
    await Promise.resolve();
    expect(onShowAll).toHaveBeenCalledOnce();
    expect(onOverview).toHaveBeenCalledOnce();

    // Re-render should not create duplicates
    capturedHook!(null, root);
    expect(root.querySelectorAll(".show-all-hidden-journals-button").length).toBe(1);
    expect(root.querySelectorAll(".journal-overview-button").length).toBe(1);
  });

  it("should be idempotent (register once)", () => {
    const hooks = {
      on: vi.fn(() => ok(1)),
    } as any;
    const logger = { error: vi.fn() } as any;

    const adapter = new FoundryJournalDirectoryButtonsAdapter(hooks, logger);
    const config = {
      shouldShowButtons: () => true,
      onShowAllHiddenJournalsClick: async () => {},
      onOpenJournalOverviewClick: async () => {},
      showAllButton: { title: "t1", labelHtml: "a", cssClass: "a" },
      overviewButton: { title: "t2", labelHtml: "b", cssClass: "b" },
    };

    expect(adapter.registerButtons(config as any).ok).toBe(true);
    expect(adapter.registerButtons(config as any).ok).toBe(true);
    expect(hooks.on).toHaveBeenCalledOnce();
  });

  it("should append to directory header when action buttons container is missing", () => {
    let capturedHook: ((...args: unknown[]) => void) | null = null;
    const hooks = {
      on: vi.fn((_name: string, cb: (...args: unknown[]) => void) => {
        capturedHook = cb;
        return ok(1);
      }),
    } as any;
    const logger = { error: vi.fn() } as any;

    const adapter = new FoundryJournalDirectoryButtonsAdapter(hooks, logger);
    const result = adapter.registerButtons({
      shouldShowButtons: () => true,
      onShowAllHiddenJournalsClick: async () => {},
      onOpenJournalOverviewClick: async () => {},
      showAllButton: { title: "t1", labelHtml: "a", cssClass: "show-all-hidden-journals-button" },
      overviewButton: { title: "t2", labelHtml: "b", cssClass: "journal-overview-button" },
    });
    expect(result.ok).toBe(true);

    const root = document.createElement("div");
    const header = document.createElement("div");
    header.className = "directory-header";
    root.appendChild(header);

    capturedHook!(null, root);
    expect(header.querySelector(".show-all-hidden-journals-button")).toBeTruthy();
    expect(header.querySelector(".journal-overview-button")).toBeTruthy();
  });

  it("should return error when hook registration fails", () => {
    const hooks = {
      on: vi.fn(() => err({ code: "OPERATION_FAILED", message: "fail" })),
    } as any;
    const logger = { error: vi.fn() } as any;

    const adapter = new FoundryJournalDirectoryButtonsAdapter(hooks, logger);
    const result = adapter.registerButtons({
      shouldShowButtons: () => true,
      onShowAllHiddenJournalsClick: async () => {},
      onOpenJournalOverviewClick: async () => {},
      showAllButton: { title: "t1", labelHtml: "a", cssClass: "a" },
      overviewButton: { title: "t2", labelHtml: "b", cssClass: "b" },
    });

    expect(result.ok).toBe(false);
  });

  it("should ignore invalid hook args", () => {
    let capturedHook: ((...args: unknown[]) => void) | null = null;
    const hooks = {
      on: vi.fn((_name: string, cb: (...args: unknown[]) => void) => {
        capturedHook = cb;
        return ok(1);
      }),
    } as any;
    const logger = { error: vi.fn() } as any;

    const adapter = new FoundryJournalDirectoryButtonsAdapter(hooks, logger);
    const result = adapter.registerButtons({
      shouldShowButtons: () => true,
      onShowAllHiddenJournalsClick: async () => {},
      onOpenJournalOverviewClick: async () => {},
      showAllButton: { title: "t1", labelHtml: "a", cssClass: "a" },
      overviewButton: { title: "t2", labelHtml: "b", cssClass: "b" },
    });
    expect(result.ok).toBe(true);

    capturedHook!(); // args.length < 2
    capturedHook!(null, "not-element"); // html not HTMLElement
  });

  it("should not inject buttons when shouldShowButtons returns false", () => {
    let capturedHook: ((...args: unknown[]) => void) | null = null;
    const hooks = {
      on: vi.fn((_name: string, cb: (...args: unknown[]) => void) => {
        capturedHook = cb;
        return ok(1);
      }),
    } as any;
    const logger = { error: vi.fn() } as any;

    const adapter = new FoundryJournalDirectoryButtonsAdapter(hooks, logger);
    const result = adapter.registerButtons({
      shouldShowButtons: () => false,
      onShowAllHiddenJournalsClick: async () => {},
      onOpenJournalOverviewClick: async () => {},
      showAllButton: { title: "t1", labelHtml: "a", cssClass: "a" },
      overviewButton: { title: "t2", labelHtml: "b", cssClass: "b" },
    });
    expect(result.ok).toBe(true);

    const root = document.createElement("div");
    capturedHook!(null, root);
    expect(root.querySelector(".a")).toBeNull();
    expect(root.querySelector(".b")).toBeNull();
  });

  it("should log errors when button handlers reject", async () => {
    let capturedHook: ((...args: unknown[]) => void) | null = null;
    const hooks = {
      on: vi.fn((_name: string, cb: (...args: unknown[]) => void) => {
        capturedHook = cb;
        return ok(1);
      }),
    } as any;
    const logger = { error: vi.fn() } as any;

    const adapter = new FoundryJournalDirectoryButtonsAdapter(hooks, logger);
    const result = adapter.registerButtons({
      shouldShowButtons: () => true,
      onShowAllHiddenJournalsClick: async () => {
        throw new Error("x");
      },
      onOpenJournalOverviewClick: async () => {
        throw new Error("y");
      },
      showAllButton: {
        title: "t1",
        labelHtml: "<span>all</span>",
        cssClass: "show-all-hidden-journals-button",
      },
      overviewButton: {
        title: "t2",
        labelHtml: "<span>ov</span>",
        cssClass: "journal-overview-button",
      },
    });
    expect(result.ok).toBe(true);

    const root = document.createElement("div");
    root.appendChild(document.createElement("div")); // ensure html.firstChild exists
    capturedHook!(null, root);

    (root.querySelector(".show-all-hidden-journals-button") as HTMLButtonElement).click();
    (root.querySelector(".journal-overview-button") as HTMLButtonElement).click();

    await Promise.resolve();
    await Promise.resolve();

    expect(logger.error).toHaveBeenCalled();
  });

  it("should handle missing game/user by passing undefined role", () => {
    (globalThis as any).game = undefined;

    let capturedHook: ((...args: unknown[]) => void) | null = null;
    const hooks = {
      on: vi.fn((_name: string, cb: (...args: unknown[]) => void) => {
        capturedHook = cb;
        return ok(1);
      }),
    } as any;
    const logger = { error: vi.fn() } as any;

    const shouldShowButtons = vi.fn(() => true);

    const adapter = new FoundryJournalDirectoryButtonsAdapter(hooks, logger);
    const result = adapter.registerButtons({
      shouldShowButtons,
      onShowAllHiddenJournalsClick: async () => {},
      onOpenJournalOverviewClick: async () => {},
      showAllButton: { title: "t1", labelHtml: "a", cssClass: "a" },
      overviewButton: { title: "t2", labelHtml: "b", cssClass: "b" },
    });
    expect(result.ok).toBe(true);

    const root = document.createElement("div");
    capturedHook!(null, root);

    expect(shouldShowButtons).toHaveBeenCalledWith(undefined);
  });
});
