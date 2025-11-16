/**
 * Tests for RenderJournalDirectoryHook
 */
/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { describe, it, expect, vi } from "vitest";
import {
  RenderJournalDirectoryHook,
  DIRenderJournalDirectoryHook,
} from "../render-journal-directory-hook";
import { ok, err } from "@/utils/functional/result";
import { MODULE_CONSTANTS } from "@/constants";
import { foundryHooksToken } from "@/foundry/foundrytokens";
import { journalVisibilityServiceToken, notificationCenterToken } from "@/tokens/tokenindex";
import type { FoundryHooks } from "@/foundry/interfaces/FoundryHooks";
import type { NotificationCenter } from "@/notifications/NotificationCenter";
import type { JournalVisibilityService } from "@/services/JournalVisibilityService";

describe("RenderJournalDirectoryHook", () => {
  describe("register", () => {
    it("should register hook and handle success", () => {
      const mockHooks: Pick<FoundryHooks, "on" | "off"> = {
        on: vi.fn().mockReturnValue(ok(42)),
        off: vi.fn(),
      };
      const mockJournalVisibility: Pick<JournalVisibilityService, "processJournalDirectory"> = {
        processJournalDirectory: vi.fn(),
      };
      const mockNotificationCenter: Pick<NotificationCenter, "debug" | "error"> = {
        debug: vi.fn().mockReturnValue(ok(undefined)),
        error: vi.fn().mockReturnValue(ok(undefined)),
      } as unknown as NotificationCenter;

      const hook = new RenderJournalDirectoryHook(
        mockHooks as FoundryHooks,
        mockJournalVisibility as JournalVisibilityService,
        mockNotificationCenter
      );

      const result = hook.register({} as never);

      expect(result.ok).toBe(true);
      expect(mockHooks.on).toHaveBeenCalledWith(
        MODULE_CONSTANTS.HOOKS.RENDER_JOURNAL_DIRECTORY,
        expect.any(Function)
      );
    });

    it("should log error when app parameter is invalid", () => {
      const mockHooks: Pick<FoundryHooks, "on" | "off"> = {
        on: vi.fn().mockReturnValue(ok(1)),
        off: vi.fn(),
      };
      const mockJournalVisibility: Pick<JournalVisibilityService, "processJournalDirectory"> = {
        processJournalDirectory: vi.fn(),
      };
      const mockNotificationCenter: Pick<NotificationCenter, "debug" | "error"> = {
        debug: vi.fn().mockReturnValue(ok(undefined)),
        error: vi.fn().mockReturnValue(ok(undefined)),
      } as unknown as NotificationCenter;

      const hook = new RenderJournalDirectoryHook(
        mockHooks as FoundryHooks,
        mockJournalVisibility as JournalVisibilityService,
        mockNotificationCenter
      );

      const result = hook.register({} as never);
      expect(result.ok).toBe(true);

      const hooksOnMock = mockHooks.on as ReturnType<typeof vi.fn>;
      const hookCallback = hooksOnMock.mock.calls.find(
        ([hookName]) => hookName === MODULE_CONSTANTS.HOOKS.RENDER_JOURNAL_DIRECTORY
      )?.[1] as ((app: unknown, html: unknown) => void) | undefined;

      expect(hookCallback).toBeDefined();

      const mockHtml = document.createElement("div");
      hookCallback!(null, mockHtml);

      expect(mockNotificationCenter.error).toHaveBeenCalledWith(
        `Invalid app parameter in ${MODULE_CONSTANTS.HOOKS.RENDER_JOURNAL_DIRECTORY} hook`,
        expect.objectContaining({ code: expect.any(String) }),
        { channels: ["ConsoleChannel"] }
      );
      expect(mockJournalVisibility.processJournalDirectory).not.toHaveBeenCalled();
    });

    it("should log error when html argument is invalid", () => {
      const mockHooks: Pick<FoundryHooks, "on" | "off"> = {
        on: vi.fn().mockReturnValue(ok(2)),
        off: vi.fn(),
      };
      const mockJournalVisibility: Pick<JournalVisibilityService, "processJournalDirectory"> = {
        processJournalDirectory: vi.fn(),
      };
      const mockNotificationCenter: Pick<NotificationCenter, "debug" | "error"> = {
        debug: vi.fn().mockReturnValue(ok(undefined)),
        error: vi.fn().mockReturnValue(ok(undefined)),
      } as unknown as NotificationCenter;

      const hook = new RenderJournalDirectoryHook(
        mockHooks as FoundryHooks,
        mockJournalVisibility as JournalVisibilityService,
        mockNotificationCenter
      );

      const result = hook.register({} as never);
      expect(result.ok).toBe(true);

      const hooksOnMock = mockHooks.on as ReturnType<typeof vi.fn>;
      const hookCallback = hooksOnMock.mock.calls.find(
        ([hookName]) => hookName === MODULE_CONSTANTS.HOOKS.RENDER_JOURNAL_DIRECTORY
      )?.[1] as ((app: unknown, html: unknown) => void) | undefined;

      const mockApp = { id: "journal-directory", object: {}, options: {} };
      hookCallback!(mockApp, { invalid: true });

      expect(mockNotificationCenter.error).toHaveBeenCalledWith(
        "Failed to get HTMLElement from hook - incompatible format",
        expect.objectContaining({ code: "INVALID_HTML_ELEMENT" }),
        { channels: ["ConsoleChannel"] }
      );
      expect(mockJournalVisibility.processJournalDirectory).not.toHaveBeenCalled();
    });

    it("should log error when hook registration fails", () => {
      const mockHooks: Pick<FoundryHooks, "on" | "off"> = {
        on: vi.fn().mockReturnValue(
          err({
            code: "OPERATION_FAILED",
            message: "Hook failed",
          })
        ) as never,
        off: vi.fn(),
      };
      const mockJournalVisibility: Pick<JournalVisibilityService, "processJournalDirectory"> = {
        processJournalDirectory: vi.fn(),
      };
      const mockNotificationCenter: Pick<NotificationCenter, "debug" | "error"> = {
        debug: vi.fn().mockReturnValue(ok(undefined)),
        error: vi.fn().mockReturnValue(ok(undefined)),
      } as unknown as NotificationCenter;

      const hook = new RenderJournalDirectoryHook(
        mockHooks as FoundryHooks,
        mockJournalVisibility as JournalVisibilityService,
        mockNotificationCenter
      );

      const result = hook.register({} as never);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain("Hook registration failed");
      }
      expect(mockNotificationCenter.error).toHaveBeenCalledWith(
        `Failed to register ${MODULE_CONSTANTS.HOOKS.RENDER_JOURNAL_DIRECTORY} hook`,
        expect.objectContaining({ message: "Hook failed" }),
        { channels: ["ConsoleChannel"] }
      );
    });
  });

  describe("dispose", () => {
    it("should dispose safely when register was never called", () => {
      const mockHooks: Pick<FoundryHooks, "on" | "off"> = {
        on: vi.fn().mockReturnValue(ok(1)),
        off: vi.fn(),
      };
      const mockJournalVisibility: Pick<JournalVisibilityService, "processJournalDirectory"> = {
        processJournalDirectory: vi.fn(),
      };
      const mockNotificationCenter: Pick<NotificationCenter, "debug" | "error"> = {
        debug: vi.fn().mockReturnValue(ok(undefined)),
        error: vi.fn().mockReturnValue(ok(undefined)),
      } as unknown as NotificationCenter;

      const hook = new RenderJournalDirectoryHook(
        mockHooks as FoundryHooks,
        mockJournalVisibility as JournalVisibilityService,
        mockNotificationCenter
      );

      expect(() => hook.dispose()).not.toThrow();
    });

    it("should unregister hook when registered (or fail gracefully)", () => {
      const mockHooks: Pick<FoundryHooks, "on" | "off"> = {
        on: vi.fn().mockReturnValue(ok(7)),
        off: vi.fn(),
      };
      const mockJournalVisibility: Pick<JournalVisibilityService, "processJournalDirectory"> = {
        processJournalDirectory: vi.fn(),
      };
      const mockNotificationCenter: Pick<NotificationCenter, "debug" | "error"> = {
        debug: vi.fn().mockReturnValue(ok(undefined)),
        error: vi.fn().mockReturnValue(ok(undefined)),
      } as unknown as NotificationCenter;

      const hook = new RenderJournalDirectoryHook(
        mockHooks as FoundryHooks,
        mockJournalVisibility as JournalVisibilityService,
        mockNotificationCenter
      );

      hook.register({} as never);

      expect(() => hook.dispose()).not.toThrow();
      expect(mockHooks.off).toHaveBeenCalledWith(
        MODULE_CONSTANTS.HOOKS.RENDER_JOURNAL_DIRECTORY,
        7
      );
    });
  });

  describe("Dependencies", () => {
    it("should expose empty dependency arrays", () => {
      expect(
        (RenderJournalDirectoryHook as unknown as { dependencies?: unknown }).dependencies
      ).toBeUndefined();
      expect(DIRenderJournalDirectoryHook.dependencies).toEqual([
        foundryHooksToken,
        journalVisibilityServiceToken,
        notificationCenterToken,
      ]);
    });
  });
});
