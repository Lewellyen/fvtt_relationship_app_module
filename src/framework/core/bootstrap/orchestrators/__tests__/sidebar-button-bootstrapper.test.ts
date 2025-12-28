import { describe, it, expect, vi, beforeEach } from "vitest";
import { SidebarButtonBootstrapper } from "../sidebar-button-bootstrapper";
import type { PlatformContainerPort } from "@/domain/ports/platform-container-port.interface";
import type { ShowAllHiddenJournalsUseCase } from "@/application/use-cases/show-all-hidden-journals.use-case";
import type { FoundryHooksPort } from "@/infrastructure/adapters/foundry/services/FoundryHooksPort";
import { showAllHiddenJournalsUseCaseToken } from "@/application/tokens/event.tokens";
import { foundryHooksToken } from "@/infrastructure/shared/tokens/foundry/foundry-hooks.token";
import { ok, err } from "@/domain/utils/result";

describe("SidebarButtonBootstrapper", () => {
  let mockContainer: PlatformContainerPort;
  let mockUseCase: ShowAllHiddenJournalsUseCase;
  let mockHooks: FoundryHooksPort;

  beforeEach(() => {
    mockUseCase = {
      execute: vi.fn().mockResolvedValue(ok(5)),
    } as unknown as ShowAllHiddenJournalsUseCase;

    mockHooks = {
      on: vi.fn().mockReturnValue(ok(1)),
      once: vi.fn(),
      off: vi.fn(),
      dispose: vi.fn(),
    } as unknown as FoundryHooksPort;

    mockContainer = {
      resolveWithError: vi.fn().mockImplementation((token) => {
        if (token === showAllHiddenJournalsUseCaseToken) {
          return ok(mockUseCase);
        }
        if (token === foundryHooksToken) {
          return ok(mockHooks);
        }
        return err({ code: "SERVICE_NOT_FOUND", message: "Service not found" });
      }),
      resolve: vi.fn(),
      getValidationState: vi.fn(),
      isRegistered: vi.fn(),
    } as unknown as PlatformContainerPort;
  });

  describe("registerSidebarButton", () => {
    it("should return error if use-case cannot be resolved", () => {
      vi.mocked(mockContainer.resolveWithError).mockReturnValue(
        err({ code: "SERVICE_NOT_FOUND", message: "Use case not found" })
      );

      const result = SidebarButtonBootstrapper.registerSidebarButton(mockContainer);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("ShowAllHiddenJournalsUseCase could not be resolved");
      }
    });

    it("should return error if FoundryHooksPort cannot be resolved", () => {
      vi.mocked(mockContainer.resolveWithError).mockImplementation((token) => {
        if (token === showAllHiddenJournalsUseCaseToken) {
          return ok(mockUseCase);
        }
        if (token === foundryHooksToken) {
          return err({ code: "SERVICE_NOT_FOUND", message: "Hooks not found" });
        }
        return err({ code: "SERVICE_NOT_FOUND", message: "Service not found" });
      });

      const result = SidebarButtonBootstrapper.registerSidebarButton(mockContainer);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("FoundryHooksPort could not be resolved");
      }
    });

    it("should register renderJournalDirectory hook", () => {
      const result = SidebarButtonBootstrapper.registerSidebarButton(mockContainer);

      expect(result.ok).toBe(true);
      expect(mockHooks.on).toHaveBeenCalledWith("renderJournalDirectory", expect.any(Function));
    });

    it("should add button to journal directory", () => {
      SidebarButtonBootstrapper.registerSidebarButton(mockContainer);

      const hookCallback = vi.mocked(mockHooks.on).mock.calls[0]![1] as (
        ...args: unknown[]
      ) => void;

      const mockHtml = document.createElement("div");
      const mockDirectoryHeader = document.createElement("div");
      mockDirectoryHeader.className = "directory-header";
      const mockActionButtons = document.createElement("div");
      mockActionButtons.className = "header-actions action-buttons";
      mockDirectoryHeader.appendChild(mockActionButtons);
      mockHtml.appendChild(mockDirectoryHeader);

      // renderJournalDirectory hook passes (app, html) - app is not used but still passed
      hookCallback({}, mockHtml);

      const button = mockActionButtons.querySelector(".show-all-hidden-journals-button");
      expect(button).not.toBeNull();
      expect(button?.tagName).toBe("BUTTON");
    });

    it("should not add duplicate buttons on re-render", () => {
      SidebarButtonBootstrapper.registerSidebarButton(mockContainer);

      const hookCallback = vi.mocked(mockHooks.on).mock.calls[0]![1] as (
        ...args: unknown[]
      ) => void;

      const mockHtml = document.createElement("div");
      const mockDirectoryHeader = document.createElement("div");
      mockDirectoryHeader.className = "directory-header";
      const mockActionButtons = document.createElement("div");
      mockActionButtons.className = "header-actions action-buttons";
      const existingButton = document.createElement("button");
      existingButton.className = "show-all-hidden-journals-button";
      mockActionButtons.appendChild(existingButton);
      mockDirectoryHeader.appendChild(mockActionButtons);
      mockHtml.appendChild(mockDirectoryHeader);

      hookCallback({}, mockHtml);

      // Should only have one button
      const buttons = mockHtml.querySelectorAll(".show-all-hidden-journals-button");
      expect(buttons.length).toBe(1);
    });

    it("should call use-case execute when button is clicked", async () => {
      SidebarButtonBootstrapper.registerSidebarButton(mockContainer);

      const hookCallback = vi.mocked(mockHooks.on).mock.calls[0]![1] as (
        ...args: unknown[]
      ) => void;

      const mockHtml = document.createElement("div");
      const mockDirectoryHeader = document.createElement("div");
      mockDirectoryHeader.className = "directory-header";
      const mockActionButtons = document.createElement("div");
      mockActionButtons.className = "header-actions action-buttons";
      mockDirectoryHeader.appendChild(mockActionButtons);
      mockHtml.appendChild(mockDirectoryHeader);

      hookCallback({}, mockHtml);

      const button = mockActionButtons.querySelector(
        ".show-all-hidden-journals-button"
      ) as HTMLButtonElement;
      expect(button).not.toBeNull();

      // Simulate button click
      button.click();
      await vi.waitFor(() => {
        expect(mockUseCase.execute).toHaveBeenCalledTimes(1);
      });
    });

    it("should add button to directory-header if action-buttons not found", () => {
      SidebarButtonBootstrapper.registerSidebarButton(mockContainer);

      const hookCallback = vi.mocked(mockHooks.on).mock.calls[0]![1] as (
        ...args: unknown[]
      ) => void;

      const mockHtml = document.createElement("div");
      const mockDirectoryHeader = document.createElement("div");
      mockDirectoryHeader.className = "directory-header";
      // No action-buttons element
      mockHtml.appendChild(mockDirectoryHeader);

      hookCallback({}, mockHtml);

      const button = mockDirectoryHeader.querySelector(".show-all-hidden-journals-button");
      expect(button).not.toBeNull();
      expect(button?.parentElement).toBe(mockDirectoryHeader);
    });

    it("should add button to top of sidebar if neither action-buttons nor directory-header found", () => {
      SidebarButtonBootstrapper.registerSidebarButton(mockContainer);

      const hookCallback = vi.mocked(mockHooks.on).mock.calls[0]![1] as (
        ...args: unknown[]
      ) => void;

      const mockHtml = document.createElement("div");
      // No action-buttons and no directory-header element

      hookCallback({}, mockHtml);

      const button = mockHtml.querySelector(".show-all-hidden-journals-button");
      expect(button).not.toBeNull();
      expect(button?.parentElement).toBe(mockHtml);
      // Button should be the first child
      expect(mockHtml.firstChild).toBe(button);
    });

    it("should return early if args.length < 2", () => {
      SidebarButtonBootstrapper.registerSidebarButton(mockContainer);

      const hookCallback = vi.mocked(mockHooks.on).mock.calls[0]![1] as (
        ...args: unknown[]
      ) => void;

      const mockHtml = document.createElement("div");

      // Call with insufficient args
      hookCallback();

      // Should not throw and should not add button
      const button = mockHtml.querySelector(".show-all-hidden-journals-button");
      expect(button).toBeNull();
    });


    it("should return early if html is not an HTMLElement", () => {
      SidebarButtonBootstrapper.registerSidebarButton(mockContainer);

      const hookCallback = vi.mocked(mockHooks.on).mock.calls[0]![1] as (
        ...args: unknown[]
      ) => void;

      const mockHtml = "not an HTMLElement";

      // Should not throw (early return)
      expect(() => hookCallback({}, mockHtml)).not.toThrow();
    });

    it("should handle hook registration errors", () => {
      vi.mocked(mockHooks.on).mockReturnValue(
        err({ code: "OPERATION_FAILED", message: "Hook registration failed" })
      );

      const result = SidebarButtonBootstrapper.registerSidebarButton(mockContainer);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("Failed to register sidebar button hook");
      }
    });
  });
});
