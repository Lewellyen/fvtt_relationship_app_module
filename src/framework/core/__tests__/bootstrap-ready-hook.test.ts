// Test file: `any` needed for mocking Foundry global objects (game, Hooks, ui)

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { BootstrapReadyHookService } from "@/framework/core/bootstrap-ready-hook";
import type { Logger } from "@/infrastructure/logging/logger.interface";
import type { PlatformBootstrapEventPort } from "@/domain/ports/platform-bootstrap-event-port.interface";
import type { ModuleReadyService } from "@/application/services/module-ready-service";
import { createMockGame } from "@/test/mocks/foundry";
import { withFoundryGlobals } from "@/test/utils/test-helpers";
import { ok, err } from "@/domain/utils/result";

describe("BootstrapReadyHookService", () => {
  let mockLogger: Logger;
  let mockBootstrapEvents: PlatformBootstrapEventPort;
  let mockModuleReadyService: ModuleReadyService;
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

    mockModuleReadyService = {
      setReady: vi.fn(),
    } as unknown as ModuleReadyService;

    cleanup = withFoundryGlobals({
      game: createMockGame(),
    });

    // Mock PlatformBootstrapEventPort that captures the callback
    mockBootstrapEvents = {
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
    it("should register ready event via PlatformBootstrapEventPort", () => {
      const service = new BootstrapReadyHookService(
        mockLogger,
        mockBootstrapEvents,
        mockModuleReadyService
      );
      service.register();

      expect(mockBootstrapEvents.onReady).toHaveBeenCalledWith(expect.any(Function));
    });

    it("should warn when event registration fails", () => {
      const failingBootstrapEvents: PlatformBootstrapEventPort = {
        onInit: vi.fn().mockReturnValue(ok(undefined)),
        onReady: vi.fn().mockReturnValue(
          err({
            code: "PLATFORM_NOT_AVAILABLE",
            message: "Hooks not available",
          })
        ),
      };

      const service = new BootstrapReadyHookService(
        mockLogger,
        failingBootstrapEvents,
        mockModuleReadyService
      );
      service.register();

      expect(mockLogger.warn).toHaveBeenCalledWith(
        "Ready hook registration failed: Hooks not available",
        undefined
      );
    });

    it("should execute ready callback and log messages", () => {
      const service = new BootstrapReadyHookService(
        mockLogger,
        mockBootstrapEvents,
        mockModuleReadyService
      );
      service.register();

      expect(capturedReadyCallback).toBeDefined();
      capturedReadyCallback!();

      expect(mockLogger.info).toHaveBeenCalledWith("ready-phase");
      expect(mockModuleReadyService.setReady).toHaveBeenCalledOnce();
      expect(mockLogger.info).toHaveBeenCalledWith("ready-phase completed");
    });

    it("should call moduleReadyService.setReady() when ready callback executes", () => {
      const service = new BootstrapReadyHookService(
        mockLogger,
        mockBootstrapEvents,
        mockModuleReadyService
      );
      service.register();

      expect(capturedReadyCallback).toBeDefined();
      capturedReadyCallback!();

      expect(mockModuleReadyService.setReady).toHaveBeenCalledOnce();
    });
  });
});
