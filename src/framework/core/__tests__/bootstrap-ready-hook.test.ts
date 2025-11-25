// Test file: `any` needed for mocking Foundry global objects (game, Hooks, ui)

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { BootstrapReadyHookService } from "@/framework/core/bootstrap-ready-hook";
import type { Logger } from "@/infrastructure/logging/logger.interface";
import type { BootstrapHooksPort } from "@/domain/ports/bootstrap-hooks-port.interface";
import { createMockGame } from "@/test/mocks/foundry";
import { withFoundryGlobals } from "@/test/utils/test-helpers";
import { ok, err } from "@/infrastructure/shared/utils/result";

describe("BootstrapReadyHookService", () => {
  let mockLogger: Logger;
  let mockBootstrapHooks: BootstrapHooksPort;
  let cleanup: (() => void) | undefined;
  let capturedReadyCallback: (() => void) | undefined;

  beforeEach(() => {
    vi.resetModules();
    capturedReadyCallback = undefined;

    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
      setMinLevel: vi.fn(),
    } as unknown as Logger;

    cleanup = withFoundryGlobals({
      game: createMockGame(),
    });

    // Mock BootstrapHooksPort that captures the callback
    mockBootstrapHooks = {
      onInit: vi.fn().mockReturnValue(ok(undefined)),
      onReady: vi.fn().mockImplementation((callback: () => void) => {
        capturedReadyCallback = callback;
        return ok(undefined);
      }),
    };
  });

  afterEach(() => {
    cleanup?.();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe("register()", () => {
    it("should register ready hook via BootstrapHooksPort", () => {
      const service = new BootstrapReadyHookService(mockLogger, mockBootstrapHooks);
      service.register();

      expect(mockBootstrapHooks.onReady).toHaveBeenCalledWith(expect.any(Function));
    });

    it("should warn when hook registration fails", () => {
      const failingBootstrapHooks: BootstrapHooksPort = {
        onInit: vi.fn().mockReturnValue(ok(undefined)),
        onReady: vi.fn().mockReturnValue(
          err({
            code: "PLATFORM_NOT_AVAILABLE",
            message: "Hooks not available",
          })
        ),
      };

      const service = new BootstrapReadyHookService(mockLogger, failingBootstrapHooks);
      service.register();

      expect(mockLogger.warn).toHaveBeenCalledWith(
        "Ready hook registration failed: Hooks not available",
        undefined
      );
    });

    it("should execute ready callback and log messages", () => {
      const service = new BootstrapReadyHookService(mockLogger, mockBootstrapHooks);
      service.register();

      expect(capturedReadyCallback).toBeDefined();
      capturedReadyCallback!();

      expect(mockLogger.info).toHaveBeenCalledWith("ready-phase");
      expect(mockLogger.info).toHaveBeenCalledWith("ready-phase completed");
    });
  });
});
