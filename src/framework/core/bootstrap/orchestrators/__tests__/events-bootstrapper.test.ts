import { describe, it, expect, beforeEach, vi } from "vitest";
import { EventsBootstrapper } from "../events-bootstrapper";
import type { PlatformContainerPort } from "@/domain/ports/platform-container-port.interface";
import { moduleEventRegistrarToken } from "@/application/tokens/event.tokens";
import { windowHooksServiceToken } from "@/application/windows/tokens/window.tokens";
import { ok, err } from "@/domain/utils/result";
import type { ModuleEventRegistrar } from "@/application/services/ModuleEventRegistrar";
import type { WindowHooksService } from "@/application/windows/services/window-hooks-service";

describe("EventsBootstrapper", () => {
  let mockContainer: PlatformContainerPort;
  let mockEventRegistrar: ModuleEventRegistrar;
  let mockWindowHooksService: WindowHooksService;

  beforeEach(() => {
    mockEventRegistrar = {
      registerAll: vi.fn().mockReturnValue(ok(undefined)),
    } as unknown as ModuleEventRegistrar;

    mockWindowHooksService = {
      register: vi.fn(),
    } as unknown as WindowHooksService;

    mockContainer = {
      resolveWithError: vi.fn((token) => {
        if (token === moduleEventRegistrarToken) {
          return ok(mockEventRegistrar);
        }
        if (token === windowHooksServiceToken) {
          return ok(mockWindowHooksService);
        }
        return err({
          code: "TokenNotRegistered",
          message: "Token not found",
          tokenDescription: String(token),
        });
      }),
    } as unknown as PlatformContainerPort;
  });

  it("should register events successfully", () => {
    const result = EventsBootstrapper.registerEvents(mockContainer);

    expect(result.ok).toBe(true);
    expect(mockEventRegistrar.registerAll).toHaveBeenCalled();
    expect(mockWindowHooksService.register).toHaveBeenCalled();
  });

  it("should register events successfully even when WindowHooksService is not available", () => {
    vi.mocked(mockContainer.resolveWithError).mockImplementation((token) => {
      if (token === moduleEventRegistrarToken) {
        return ok(mockEventRegistrar);
      }
      if (token === windowHooksServiceToken) {
        return err({
          code: "TokenNotRegistered",
          message: "WindowHooksService not found",
          tokenDescription: String(windowHooksServiceToken),
        });
      }
      return err({
        code: "TokenNotRegistered",
        message: "Token not found",
        tokenDescription: String(token),
      });
    });

    const result = EventsBootstrapper.registerEvents(mockContainer);

    expect(result.ok).toBe(true);
    expect(mockEventRegistrar.registerAll).toHaveBeenCalled();
    expect(mockWindowHooksService.register).not.toHaveBeenCalled();
  });

  it("should return error when ModuleEventRegistrar cannot be resolved", () => {
    vi.mocked(mockContainer.resolveWithError).mockReturnValue(
      err({
        code: "TokenNotRegistered",
        message: "ModuleEventRegistrar not found",
        tokenDescription: String(moduleEventRegistrarToken),
      })
    );

    const result = EventsBootstrapper.registerEvents(mockContainer);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("Failed to resolve ModuleEventRegistrar");
    }
    expect(mockEventRegistrar.registerAll).not.toHaveBeenCalled();
  });

  it("should return error when registerAll fails", () => {
    vi.mocked(mockEventRegistrar.registerAll).mockReturnValue(
      err([new Error("Event registration failed 1"), new Error("Event registration failed 2")])
    );

    const result = EventsBootstrapper.registerEvents(mockContainer);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("Failed to register one or more event listeners");
      expect(result.error).toContain("Event registration failed 1");
      expect(result.error).toContain("Event registration failed 2");
    }
    expect(mockWindowHooksService.register).not.toHaveBeenCalled();
  });
});
