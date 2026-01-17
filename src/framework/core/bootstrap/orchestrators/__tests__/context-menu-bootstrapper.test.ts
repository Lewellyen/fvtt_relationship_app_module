import { describe, it, expect, beforeEach, vi } from "vitest";
import { ContextMenuBootstrapper } from "../context-menu-bootstrapper";
import type { PlatformContainerPort } from "@/domain/ports/platform-container-port.interface";
import { registerContextMenuUseCaseToken } from "@/application/tokens/event.tokens";
import { platformContextMenuRegistrationPortToken } from "@/application/tokens/domain-ports.tokens";
import { ok, err } from "@/domain/utils/result";
import type { PlatformContextMenuRegistrationPort } from "@/domain/ports/platform-context-menu-registration-port.interface";
import type { RegisterContextMenuUseCase } from "@/application/use-cases/register-context-menu.use-case";

describe("ContextMenuBootstrapper", () => {
  let mockContainer: PlatformContainerPort;
  let mockContextMenuPort: PlatformContextMenuRegistrationPort;
  let mockContextMenuUseCase: RegisterContextMenuUseCase;

  beforeEach(() => {
    mockContextMenuPort = {
      register: vi.fn().mockReturnValue(ok(undefined)),
      addCallback: vi.fn(),
      removeCallback: vi.fn(),
    } as unknown as PlatformContextMenuRegistrationPort;

    mockContextMenuUseCase = {
      register: vi.fn().mockReturnValue(ok(undefined)),
    } as unknown as RegisterContextMenuUseCase;

    mockContainer = {
      resolveWithError: vi.fn((token) => {
        if (token === platformContextMenuRegistrationPortToken) {
          return ok(mockContextMenuPort);
        }
        if (token === registerContextMenuUseCaseToken) {
          return ok(mockContextMenuUseCase);
        }
        return err({
          code: "TokenNotRegistered",
          message: "Token not found",
        });
      }),
    } as unknown as PlatformContainerPort;
  });

  it("should register context menu successfully", () => {
    const result = ContextMenuBootstrapper.registerContextMenu(mockContainer);

    expect(result.ok).toBe(true);
    expect(mockContextMenuPort.register).toHaveBeenCalled();
    expect(mockContextMenuUseCase.register).toHaveBeenCalled();
  });

  it("should return error when PlatformContextMenuRegistrationPort cannot be resolved", () => {
    vi.mocked(mockContainer.resolveWithError).mockReturnValue(
      err({
        code: "TokenNotRegistered",
        message: "PlatformContextMenuRegistrationPort not found",
      })
    );

    const result = ContextMenuBootstrapper.registerContextMenu(mockContainer);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("PlatformContextMenuRegistrationPort could not be resolved");
    }
    expect(mockContextMenuPort.register).not.toHaveBeenCalled();
  });

  it("should return error when libWrapper registration fails", () => {
    vi.mocked(mockContextMenuPort.register).mockReturnValue(err("LibWrapper registration failed"));

    const result = ContextMenuBootstrapper.registerContextMenu(mockContainer);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("Context menu registration failed");
    }
    expect(mockContextMenuUseCase.register).not.toHaveBeenCalled();
  });

  it("should return error when RegisterContextMenuUseCase cannot be resolved", () => {
    vi.mocked(mockContainer.resolveWithError).mockImplementation((token) => {
      if (token === platformContextMenuRegistrationPortToken) {
        return ok(mockContextMenuPort);
      }
      if (token === registerContextMenuUseCaseToken) {
        return err({
          code: "TokenNotRegistered",
          message: "RegisterContextMenuUseCase not found",
        });
      }
      return err({
        code: "TokenNotRegistered",
        message: "Token not found",
      });
    });

    const result = ContextMenuBootstrapper.registerContextMenu(mockContainer);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("RegisterContextMenuUseCase could not be resolved");
    }
    expect(mockContextMenuPort.register).toHaveBeenCalled();
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
    expect(mockContextMenuPort.register).toHaveBeenCalled();
    expect(mockContextMenuUseCase.register).toHaveBeenCalled();
  });
});
