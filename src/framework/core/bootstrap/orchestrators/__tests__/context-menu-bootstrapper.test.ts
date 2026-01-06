import { describe, it, expect, beforeEach, vi } from "vitest";
import { ContextMenuBootstrapper } from "../context-menu-bootstrapper";
import type { PlatformContainerPort } from "@/domain/ports/platform-container-port.interface";
import { journalContextMenuLibWrapperServiceToken } from "@/infrastructure/shared/tokens/foundry/journal-context-menu-lib-wrapper-service.token";
import { registerContextMenuUseCaseToken } from "@/application/tokens/event.tokens";
import { ok, err } from "@/domain/utils/result";
import type { JournalContextMenuLibWrapperService } from "@/infrastructure/adapters/foundry/services/JournalContextMenuLibWrapperService";
import type { RegisterContextMenuUseCase } from "@/application/use-cases/register-context-menu.use-case";

describe("ContextMenuBootstrapper", () => {
  let mockContainer: PlatformContainerPort;
  let mockContextMenuLibWrapper: JournalContextMenuLibWrapperService;
  let mockContextMenuUseCase: RegisterContextMenuUseCase;

  beforeEach(() => {
    mockContextMenuLibWrapper = {
      register: vi.fn().mockReturnValue(ok(undefined)),
    } as unknown as JournalContextMenuLibWrapperService;

    mockContextMenuUseCase = {
      register: vi.fn().mockReturnValue(ok(undefined)),
    } as unknown as RegisterContextMenuUseCase;

    mockContainer = {
      resolveWithError: vi.fn((token) => {
        if (token === journalContextMenuLibWrapperServiceToken) {
          return ok(mockContextMenuLibWrapper);
        }
        if (token === registerContextMenuUseCaseToken) {
          return ok(mockContextMenuUseCase);
        }
        return err({
          code: "TokenNotRegistered",
          message: "Token not found",
          tokenDescription: String(token),
        });
      }),
    } as unknown as PlatformContainerPort;
  });

  it("should register context menu successfully", () => {
    const result = ContextMenuBootstrapper.registerContextMenu(mockContainer);

    expect(result.ok).toBe(true);
    expect(mockContextMenuLibWrapper.register).toHaveBeenCalled();
    expect(mockContextMenuUseCase.register).toHaveBeenCalled();
  });

  it("should return error when JournalContextMenuLibWrapperService cannot be resolved", () => {
    vi.mocked(mockContainer.resolveWithError).mockReturnValue(
      err({
        code: "TokenNotRegistered",
        message: "JournalContextMenuLibWrapperService not found",
        tokenDescription: String(journalContextMenuLibWrapperServiceToken),
      })
    );

    const result = ContextMenuBootstrapper.registerContextMenu(mockContainer);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("JournalContextMenuLibWrapperService could not be resolved");
    }
    expect(mockContextMenuLibWrapper.register).not.toHaveBeenCalled();
  });

  it("should return error when libWrapper registration fails", () => {
    vi.mocked(mockContextMenuLibWrapper.register).mockReturnValue(
      err(new Error("LibWrapper registration failed"))
    );

    const result = ContextMenuBootstrapper.registerContextMenu(mockContainer);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("Context menu libWrapper registration failed");
    }
    expect(mockContextMenuUseCase.register).not.toHaveBeenCalled();
  });

  it("should return error when RegisterContextMenuUseCase cannot be resolved", () => {
    vi.mocked(mockContainer.resolveWithError).mockImplementation((token) => {
      if (token === journalContextMenuLibWrapperServiceToken) {
        return ok(mockContextMenuLibWrapper);
      }
      if (token === registerContextMenuUseCaseToken) {
        return err({
          code: "TokenNotRegistered",
          message: "RegisterContextMenuUseCase not found",
          tokenDescription: String(registerContextMenuUseCaseToken),
        });
      }
      return err({
        code: "TokenNotRegistered",
        message: "Token not found",
        tokenDescription: String(token),
      });
    });

    const result = ContextMenuBootstrapper.registerContextMenu(mockContainer);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("RegisterContextMenuUseCase could not be resolved");
    }
    expect(mockContextMenuLibWrapper.register).toHaveBeenCalled();
    expect(mockContextMenuUseCase.register).not.toHaveBeenCalled();
  });

  it("should return error when callback registration fails", () => {
    vi.mocked(mockContextMenuUseCase.register).mockReturnValue(
      err(new Error("Callback registration failed"))
    );

    const result = ContextMenuBootstrapper.registerContextMenu(mockContainer);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("Context menu callback registration failed");
    }
    expect(mockContextMenuLibWrapper.register).toHaveBeenCalled();
    expect(mockContextMenuUseCase.register).toHaveBeenCalled();
  });
});
