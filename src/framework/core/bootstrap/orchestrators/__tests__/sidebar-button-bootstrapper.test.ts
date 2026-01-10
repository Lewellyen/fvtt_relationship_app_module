import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { SidebarButtonBootstrapper } from "../sidebar-button-bootstrapper";
import type { PlatformContainerPort } from "@/domain/ports/platform-container-port.interface";
import type { ShowAllHiddenJournalsUseCase } from "@/application/use-cases/show-all-hidden-journals.use-case";
import type { FoundryHooksPort } from "@/infrastructure/adapters/foundry/services/FoundryHooksPort";
import type { IWindowFactory } from "@/domain/windows/ports/window-factory-port.interface";
import type { WindowHandle } from "@/domain/windows/types/window-handle.interface";
import type { PlatformSettingsRegistrationPort } from "@/domain/ports/platform-settings-registration-port.interface";
import { showAllHiddenJournalsUseCaseToken } from "@/application/tokens/event.tokens";
import { foundryHooksToken } from "@/infrastructure/shared/tokens/foundry/foundry-hooks.token";
import { windowFactoryToken } from "@/application/windows/tokens/window.tokens";
import { platformSettingsRegistrationPortToken } from "@/application/tokens/domain-ports.tokens";
import { ok, err } from "@/domain/utils/result";

describe("SidebarButtonBootstrapper", () => {
  let mockContainer: PlatformContainerPort;
  let mockUseCase: ShowAllHiddenJournalsUseCase;
  let mockHooks: FoundryHooksPort;
  let mockSettings: PlatformSettingsRegistrationPort;

  beforeEach(() => {
    // Mock game.user for permission checks
    vi.stubGlobal("game", {
      user: {
        id: "test-user",
        role: 4, // GAMEMASTER
      },
    });

    mockUseCase = {
      execute: vi.fn().mockResolvedValue(ok(5)),
    } as unknown as ShowAllHiddenJournalsUseCase;

    mockHooks = {
      on: vi.fn().mockReturnValue(ok(1)),
      once: vi.fn(),
      off: vi.fn(),
      dispose: vi.fn(),
    } as unknown as FoundryHooksPort;

    mockSettings = {
      registerSetting: vi.fn().mockReturnValue(ok(undefined)),
      getSettingValue: vi.fn().mockReturnValue(ok(true)), // Default: allow buttons
      setSettingValue: vi.fn().mockResolvedValue(ok(undefined)),
    } as unknown as PlatformSettingsRegistrationPort;

    mockContainer = {
      resolveWithError: vi.fn().mockImplementation((token) => {
        if (token === showAllHiddenJournalsUseCaseToken) {
          return ok(mockUseCase);
        }
        if (token === foundryHooksToken) {
          return ok(mockHooks);
        }
        if (token === platformSettingsRegistrationPortToken) {
          return ok(mockSettings);
        }
        return err({ code: "SERVICE_NOT_FOUND", message: "Service not found" });
      }),
      resolve: vi.fn(),
      getValidationState: vi.fn(),
      isRegistered: vi.fn(),
    } as unknown as PlatformContainerPort;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
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
        if (token === platformSettingsRegistrationPortToken) {
          return ok(mockSettings);
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

    it("should handle use-case execution error", async () => {
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

      // Mock use-case to return error
      vi.mocked(mockUseCase.execute).mockResolvedValue(err(new Error("Use-case execution failed")));

      hookCallback({}, mockHtml);

      const button = mockHtml.querySelector(
        ".show-all-hidden-journals-button"
      ) as HTMLButtonElement;
      expect(button).not.toBeNull();

      // Simulate button click - should handle error gracefully
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

    it("should add journal overview button to journal directory", () => {
      const mockWindowFactory: IWindowFactory = {
        createWindow: vi.fn().mockResolvedValue(
          ok({
            instanceId: "journal-overview:1",
            definitionId: "journal-overview",
            controller: {} as any,
            definition: {} as any,
            show: vi.fn().mockResolvedValue(ok(undefined)),
            hide: vi.fn().mockResolvedValue(ok(undefined)),
            close: vi.fn().mockResolvedValue(ok(undefined)),
            update: vi.fn().mockResolvedValue(ok(undefined)),
            persist: vi.fn().mockResolvedValue(ok(undefined)),
            restore: vi.fn().mockResolvedValue(ok(undefined)),
          } as WindowHandle)
        ),
      } as unknown as IWindowFactory;

      vi.mocked(mockContainer.resolveWithError).mockImplementation((token) => {
        if (token === showAllHiddenJournalsUseCaseToken) {
          return ok(mockUseCase);
        }
        if (token === foundryHooksToken) {
          return ok(mockHooks);
        }
        if (token === platformSettingsRegistrationPortToken) {
          return ok(mockSettings);
        }
        if (token === windowFactoryToken) {
          return ok(mockWindowFactory);
        }
        return err({ code: "SERVICE_NOT_FOUND", message: "Service not found" });
      });

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

      const overviewButton = mockActionButtons.querySelector(".journal-overview-button");
      expect(overviewButton).not.toBeNull();
      expect(overviewButton?.tagName).toBe("BUTTON");
    });

    it("should not add duplicate journal overview buttons on re-render", () => {
      const mockWindowFactory: IWindowFactory = {
        createWindow: vi.fn().mockResolvedValue(
          ok({
            instanceId: "journal-overview:1",
            definitionId: "journal-overview",
            controller: {} as any,
            definition: {} as any,
            show: vi.fn().mockResolvedValue(ok(undefined)),
            hide: vi.fn().mockResolvedValue(ok(undefined)),
            close: vi.fn().mockResolvedValue(ok(undefined)),
            update: vi.fn().mockResolvedValue(ok(undefined)),
            persist: vi.fn().mockResolvedValue(ok(undefined)),
            restore: vi.fn().mockResolvedValue(ok(undefined)),
          } as WindowHandle)
        ),
      } as unknown as IWindowFactory;

      vi.mocked(mockContainer.resolveWithError).mockImplementation((token) => {
        if (token === showAllHiddenJournalsUseCaseToken) {
          return ok(mockUseCase);
        }
        if (token === foundryHooksToken) {
          return ok(mockHooks);
        }
        if (token === platformSettingsRegistrationPortToken) {
          return ok(mockSettings);
        }
        if (token === windowFactoryToken) {
          return ok(mockWindowFactory);
        }
        return err({ code: "SERVICE_NOT_FOUND", message: "Service not found" });
      });

      SidebarButtonBootstrapper.registerSidebarButton(mockContainer);

      const hookCallback = vi.mocked(mockHooks.on).mock.calls[0]![1] as (
        ...args: unknown[]
      ) => void;

      const mockHtml = document.createElement("div");
      const mockDirectoryHeader = document.createElement("div");
      mockDirectoryHeader.className = "directory-header";
      const mockActionButtons = document.createElement("div");
      mockActionButtons.className = "header-actions action-buttons";
      const existingOverviewButton = document.createElement("button");
      existingOverviewButton.className = "journal-overview-button";
      mockActionButtons.appendChild(existingOverviewButton);
      mockDirectoryHeader.appendChild(mockActionButtons);
      mockHtml.appendChild(mockDirectoryHeader);

      hookCallback({}, mockHtml);

      // Should only have one button
      const buttons = mockHtml.querySelectorAll(".journal-overview-button");
      expect(buttons.length).toBe(1);
    });

    it("should open journal overview window when button is clicked", async () => {
      const mockShow = vi.fn().mockResolvedValue(ok(undefined));
      const mockWindowFactory: IWindowFactory = {
        createWindow: vi.fn().mockResolvedValue(
          ok({
            instanceId: "journal-overview:1",
            definitionId: "journal-overview",
            controller: {} as any,
            definition: {} as any,
            show: mockShow,
            hide: vi.fn().mockResolvedValue(ok(undefined)),
            close: vi.fn().mockResolvedValue(ok(undefined)),
            update: vi.fn().mockResolvedValue(ok(undefined)),
            persist: vi.fn().mockResolvedValue(ok(undefined)),
            restore: vi.fn().mockResolvedValue(ok(undefined)),
          } as WindowHandle)
        ),
      } as unknown as IWindowFactory;

      vi.mocked(mockContainer.resolveWithError).mockImplementation((token) => {
        if (token === showAllHiddenJournalsUseCaseToken) {
          return ok(mockUseCase);
        }
        if (token === foundryHooksToken) {
          return ok(mockHooks);
        }
        if (token === platformSettingsRegistrationPortToken) {
          return ok(mockSettings);
        }
        if (token === windowFactoryToken) {
          return ok(mockWindowFactory);
        }
        return err({ code: "SERVICE_NOT_FOUND", message: "Service not found" });
      });

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

      const overviewButton = mockActionButtons.querySelector(
        ".journal-overview-button"
      ) as HTMLButtonElement;
      expect(overviewButton).not.toBeNull();

      // Simulate button click
      overviewButton.click();
      await vi.waitFor(() => {
        expect(mockWindowFactory.createWindow).toHaveBeenCalledWith("journal-overview");
        expect(mockShow).toHaveBeenCalled();
      });
    });

    it("should handle window factory not available gracefully", () => {
      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      vi.mocked(mockContainer.resolveWithError).mockImplementation((token) => {
        if (token === showAllHiddenJournalsUseCaseToken) {
          return ok(mockUseCase);
        }
        if (token === foundryHooksToken) {
          return ok(mockHooks);
        }
        if (token === platformSettingsRegistrationPortToken) {
          return ok(mockSettings);
        }
        if (token === windowFactoryToken) {
          return err({ code: "SERVICE_NOT_FOUND", message: "Service not found" });
        }
        return err({ code: "SERVICE_NOT_FOUND", message: "Service not found" });
      });

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

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "[Journal Overview] WindowFactory not available:",
        "Service not found"
      );

      // Should not add overview button
      const overviewButton = mockHtml.querySelector(".journal-overview-button");
      expect(overviewButton).toBeNull();

      consoleWarnSpy.mockRestore();
    });

    it("should add journal overview button to directory-header if action-buttons not found", () => {
      const mockWindowFactory: IWindowFactory = {
        createWindow: vi.fn().mockResolvedValue(
          ok({
            instanceId: "journal-overview:1",
            definitionId: "journal-overview",
            controller: {} as any,
            definition: {} as any,
            show: vi.fn().mockResolvedValue(ok(undefined)),
            hide: vi.fn().mockResolvedValue(ok(undefined)),
            close: vi.fn().mockResolvedValue(ok(undefined)),
            update: vi.fn().mockResolvedValue(ok(undefined)),
            persist: vi.fn().mockResolvedValue(ok(undefined)),
            restore: vi.fn().mockResolvedValue(ok(undefined)),
          } as WindowHandle)
        ),
      } as unknown as IWindowFactory;

      vi.mocked(mockContainer.resolveWithError).mockImplementation((token) => {
        if (token === showAllHiddenJournalsUseCaseToken) {
          return ok(mockUseCase);
        }
        if (token === foundryHooksToken) {
          return ok(mockHooks);
        }
        if (token === platformSettingsRegistrationPortToken) {
          return ok(mockSettings);
        }
        if (token === windowFactoryToken) {
          return ok(mockWindowFactory);
        }
        return err({ code: "SERVICE_NOT_FOUND", message: "Service not found" });
      });

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

      const overviewButton = mockDirectoryHeader.querySelector(".journal-overview-button");
      expect(overviewButton).not.toBeNull();
      expect(overviewButton?.parentElement).toBe(mockDirectoryHeader);
    });

    it("should add journal overview button to top of sidebar if neither action-buttons nor directory-header found", () => {
      const mockWindowFactory: IWindowFactory = {
        createWindow: vi.fn().mockResolvedValue(
          ok({
            instanceId: "journal-overview:1",
            definitionId: "journal-overview",
            controller: {} as any,
            definition: {} as any,
            show: vi.fn().mockResolvedValue(ok(undefined)),
            hide: vi.fn().mockResolvedValue(ok(undefined)),
            close: vi.fn().mockResolvedValue(ok(undefined)),
            update: vi.fn().mockResolvedValue(ok(undefined)),
            persist: vi.fn().mockResolvedValue(ok(undefined)),
            restore: vi.fn().mockResolvedValue(ok(undefined)),
          } as WindowHandle)
        ),
      } as unknown as IWindowFactory;

      vi.mocked(mockContainer.resolveWithError).mockImplementation((token) => {
        if (token === showAllHiddenJournalsUseCaseToken) {
          return ok(mockUseCase);
        }
        if (token === foundryHooksToken) {
          return ok(mockHooks);
        }
        if (token === platformSettingsRegistrationPortToken) {
          return ok(mockSettings);
        }
        if (token === windowFactoryToken) {
          return ok(mockWindowFactory);
        }
        return err({ code: "SERVICE_NOT_FOUND", message: "Service not found" });
      });

      SidebarButtonBootstrapper.registerSidebarButton(mockContainer);

      const hookCallback = vi.mocked(mockHooks.on).mock.calls[0]![1] as (
        ...args: unknown[]
      ) => void;

      const mockHtml = document.createElement("div");
      // No action-buttons and no directory-header element

      hookCallback({}, mockHtml);

      const overviewButton = mockHtml.querySelector(".journal-overview-button");
      expect(overviewButton).not.toBeNull();
      expect(overviewButton?.parentElement).toBe(mockHtml);
      // Button should be the first child
      expect(mockHtml.firstChild).toBe(overviewButton);
    });

    it("should not show buttons if settings port is not available", () => {
      vi.mocked(mockContainer.resolveWithError).mockImplementation((token) => {
        if (token === showAllHiddenJournalsUseCaseToken) {
          return ok(mockUseCase);
        }
        if (token === foundryHooksToken) {
          return ok(mockHooks);
        }
        if (token === platformSettingsRegistrationPortToken) {
          return err({ code: "SERVICE_NOT_FOUND", message: "Settings port not found" });
        }
        return err({ code: "SERVICE_NOT_FOUND", message: "Service not found" });
      });

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

      // Should not add any buttons
      const showAllButton = mockHtml.querySelector(".show-all-hidden-journals-button");
      const overviewButton = mockHtml.querySelector(".journal-overview-button");
      expect(showAllButton).toBeNull();
      expect(overviewButton).toBeNull();
    });

    it("should not show buttons if user does not have permission", () => {
      // Mock settings to return false for permission
      vi.mocked(mockSettings.getSettingValue).mockReturnValue(ok(false));

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

      // Should not add any buttons
      const showAllButton = mockHtml.querySelector(".show-all-hidden-journals-button");
      const overviewButton = mockHtml.querySelector(".journal-overview-button");
      expect(showAllButton).toBeNull();
      expect(overviewButton).toBeNull();
    });

    it("should not show buttons if game is undefined", () => {
      // Remove game global for this test
      vi.stubGlobal("game", undefined);

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

      // Should not add any buttons because game is undefined
      const showAllButton = mockHtml.querySelector(".show-all-hidden-journals-button");
      const overviewButton = mockHtml.querySelector(".journal-overview-button");
      expect(showAllButton).toBeNull();
      expect(overviewButton).toBeNull();
    });

    it("should handle window creation error gracefully", async () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const mockWindowFactory: IWindowFactory = {
        createWindow: vi.fn().mockResolvedValue(
          err({
            code: "WindowCreationFailed",
            message: "Failed to create window",
          })
        ),
      } as unknown as IWindowFactory;

      vi.mocked(mockContainer.resolveWithError).mockImplementation((token) => {
        if (token === showAllHiddenJournalsUseCaseToken) {
          return ok(mockUseCase);
        }
        if (token === foundryHooksToken) {
          return ok(mockHooks);
        }
        if (token === platformSettingsRegistrationPortToken) {
          return ok(mockSettings);
        }
        if (token === windowFactoryToken) {
          return ok(mockWindowFactory);
        }
        return err({ code: "SERVICE_NOT_FOUND", message: "Service not found" });
      });

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

      const overviewButton = mockActionButtons.querySelector(
        ".journal-overview-button"
      ) as HTMLButtonElement;
      expect(overviewButton).not.toBeNull();

      // Simulate button click
      overviewButton.click();
      await vi.waitFor(() => {
        expect(mockWindowFactory.createWindow).toHaveBeenCalledWith("journal-overview");
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          "Failed to open journal overview window:",
          expect.any(Object)
        );
      });

      consoleErrorSpy.mockRestore();
    });
  });
});
