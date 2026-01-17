import { describe, it, expect, vi, beforeEach } from "vitest";
import { SidebarButtonBootstrapper } from "../sidebar-button-bootstrapper";
import type { PlatformContainerPort } from "@/domain/ports/platform-container-port.interface";
import { ok, err } from "@/domain/utils/result";
import { showAllHiddenJournalsUseCaseToken } from "@/application/tokens/event.tokens";
import { windowFactoryToken } from "@/application/windows/tokens/window.tokens";
import {
  platformJournalDirectoryButtonsPortToken,
  platformSettingsRegistrationPortToken,
} from "@/application/tokens/domain-ports.tokens";
import type { ShowAllHiddenJournalsUseCase } from "@/application/use-cases/show-all-hidden-journals.use-case";
import type { PlatformSettingsRegistrationPort } from "@/domain/ports/platform-settings-registration-port.interface";
import type { IWindowFactory } from "@/domain/windows/ports/window-factory-port.interface";
import type {
  PlatformJournalDirectoryButtonsPort,
  JournalDirectoryButtonsConfig,
} from "@/domain/ports/bootstrap/platform-journal-directory-buttons-port.interface";

describe("SidebarButtonBootstrapper", () => {
  let mockContainer: PlatformContainerPort;
  let mockUseCase: ShowAllHiddenJournalsUseCase;
  let mockSettings: PlatformSettingsRegistrationPort;
  let mockWindowFactory: IWindowFactory;
  let mockButtonsPort: PlatformJournalDirectoryButtonsPort;
  let capturedConfig: JournalDirectoryButtonsConfig | null;

  beforeEach(() => {
    capturedConfig = null;

    mockUseCase = {
      execute: vi.fn().mockResolvedValue(ok(undefined)),
    } as unknown as ShowAllHiddenJournalsUseCase;

    mockSettings = {
      getSettingValue: vi.fn().mockReturnValue(ok(true)),
    } as unknown as PlatformSettingsRegistrationPort;

    mockWindowFactory = {
      createWindow: vi.fn().mockResolvedValue(
        ok({
          show: vi.fn().mockResolvedValue(undefined),
        })
      ),
    } as unknown as IWindowFactory;

    mockButtonsPort = {
      registerButtons: vi.fn((config: JournalDirectoryButtonsConfig) => {
        capturedConfig = config;
        return ok(undefined);
      }),
    } as unknown as PlatformJournalDirectoryButtonsPort;

    mockContainer = {
      resolveWithError: vi.fn((token: symbol) => {
        if (token === showAllHiddenJournalsUseCaseToken) return ok(mockUseCase);
        if (token === platformSettingsRegistrationPortToken) return ok(mockSettings);
        if (token === windowFactoryToken) return ok(mockWindowFactory);
        if (token === platformJournalDirectoryButtonsPortToken) return ok(mockButtonsPort);
        return err({ code: "TokenNotRegistered", message: "Token not found" });
      }),
    } as unknown as PlatformContainerPort;
  });

  it("should register buttons successfully", async () => {
    const result = SidebarButtonBootstrapper.registerSidebarButton(mockContainer);

    expect(result.ok).toBe(true);
    expect(mockButtonsPort.registerButtons).toHaveBeenCalledOnce();
    expect(capturedConfig).toBeTruthy();

    // Cover shouldShowButtons mapping
    expect(capturedConfig!.shouldShowButtons(4)).toBe(true);
    expect(capturedConfig!.shouldShowButtons(undefined)).toBe(false);

    // Verify callbacks are wired
    await capturedConfig!.onShowAllHiddenJournalsClick();
    expect(mockUseCase.execute).toHaveBeenCalledOnce();

    await capturedConfig!.onOpenJournalOverviewClick();
    expect(mockWindowFactory.createWindow).toHaveBeenCalledWith("journal-overview");
  });

  it("should handle window creation error gracefully", async () => {
    const result = SidebarButtonBootstrapper.registerSidebarButton(mockContainer);
    expect(result.ok).toBe(true);
    expect(capturedConfig).toBeTruthy();

    vi.mocked(mockWindowFactory.createWindow).mockResolvedValueOnce(
      err({ code: "WINDOW_CREATE_FAILED", message: "no window" })
    );

    await expect(capturedConfig!.onOpenJournalOverviewClick()).resolves.toBeUndefined();
  });

  it("should return error if use case cannot be resolved", () => {
    vi.mocked(mockContainer.resolveWithError).mockReturnValueOnce(
      err({ code: "TokenNotRegistered", message: "UseCase not found" })
    );

    const result = SidebarButtonBootstrapper.registerSidebarButton(mockContainer);
    expect(result.ok).toBe(false);
  });

  it("should return error if settings port cannot be resolved", () => {
    vi.mocked(mockContainer.resolveWithError).mockImplementation((token: symbol) => {
      if (token === showAllHiddenJournalsUseCaseToken) return ok(mockUseCase);
      if (token === platformSettingsRegistrationPortToken)
        return err({ code: "TokenNotRegistered", message: "Settings not found" });
      return err({ code: "TokenNotRegistered", message: "Token not found" });
    });

    const result = SidebarButtonBootstrapper.registerSidebarButton(mockContainer);
    expect(result.ok).toBe(false);
  });

  it("should return error if buttons port cannot be resolved", () => {
    vi.mocked(mockContainer.resolveWithError).mockImplementation((token: symbol) => {
      if (token === showAllHiddenJournalsUseCaseToken) return ok(mockUseCase);
      if (token === platformSettingsRegistrationPortToken) return ok(mockSettings);
      if (token === windowFactoryToken) return ok(mockWindowFactory);
      if (token === platformJournalDirectoryButtonsPortToken)
        return err({ code: "TokenNotRegistered", message: "ButtonsPort not found" });
      return err({ code: "TokenNotRegistered", message: "Token not found" });
    });

    const result = SidebarButtonBootstrapper.registerSidebarButton(mockContainer);
    expect(result.ok).toBe(false);
  });

  it("should return error if window factory cannot be resolved", () => {
    vi.mocked(mockContainer.resolveWithError).mockImplementation((token: symbol) => {
      if (token === showAllHiddenJournalsUseCaseToken) return ok(mockUseCase);
      if (token === platformSettingsRegistrationPortToken) return ok(mockSettings);
      if (token === windowFactoryToken)
        return err({ code: "TokenNotRegistered", message: "WindowFactory not found" });
      return err({ code: "TokenNotRegistered", message: "Token not found" });
    });

    const result = SidebarButtonBootstrapper.registerSidebarButton(mockContainer);
    expect(result.ok).toBe(false);
  });

  it("should return error when registerButtons fails", () => {
    vi.mocked(mockButtonsPort.registerButtons).mockReturnValue(err("nope"));

    const result = SidebarButtonBootstrapper.registerSidebarButton(mockContainer);
    expect(result.ok).toBe(false);
  });
});
