/* eslint-disable @typescript-eslint/no-explicit-any */
// Test file: `any` needed for mocking Foundry global objects (game, Hooks, ui)

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { BootstrapInitHookService } from "@/framework/core/bootstrap-init-hook";
import type { Logger } from "@/infrastructure/logging/logger.interface";
import type { PlatformContainerPort } from "@/domain/ports/platform-container-port.interface";
import type { PlatformBootstrapEventPort } from "@/domain/ports/platform-bootstrap-event-port.interface";
import { createMockGame, createMockUI } from "@/test/mocks/foundry";
import { withFoundryGlobals } from "@/test/utils/test-helpers";
import { MODULE_METADATA } from "@/application/constants/app-constants";
import {
  foundrySettingsToken,
  journalContextMenuLibWrapperServiceToken,
} from "@/infrastructure/shared/tokens/foundry.tokens";
import {
  notificationCenterToken,
  uiChannelToken,
} from "@/infrastructure/shared/tokens/notifications.tokens";
import { moduleSettingsRegistrarToken } from "@/infrastructure/shared/tokens/core.tokens";
import { moduleApiInitializerToken } from "@/infrastructure/shared/tokens/infrastructure.tokens";
import {
  moduleEventRegistrarToken,
  registerContextMenuUseCaseToken,
} from "@/application/tokens/event.tokens";
import { ok, err } from "@/domain/utils/result";

describe("BootstrapInitHookService", () => {
  let mockLogger: Logger;
  let mockContainer: PlatformContainerPort;
  let mockBootstrapEvents: PlatformBootstrapEventPort;
  let cleanup: (() => void) | undefined;
  let capturedInitCallback: (() => void) | undefined;

  beforeEach(() => {
    vi.resetModules();
    capturedInitCallback = undefined;

    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
      setMinLevel: vi.fn(),
    } as unknown as Logger;

    const mockGame = createMockGame();
    const mockModule = {
      api: undefined as unknown,
    };
    mockGame.modules?.set(MODULE_METADATA.ID, mockModule as any);

    cleanup = withFoundryGlobals({
      game: mockGame,
      ui: createMockUI(),
    });

    mockContainer = {
      resolveWithError: vi.fn(),
      resolve: vi.fn(),
      isRegistered: vi.fn(),
      getValidationState: vi.fn(),
    } as unknown as PlatformContainerPort;

    // Mock PlatformBootstrapEventPort that captures the callback
    mockBootstrapEvents = {
      onInit: vi.fn().mockImplementation((callback: () => void) => {
        capturedInitCallback = callback;
        return ok(undefined);
      }),
      onReady: vi.fn().mockReturnValue(ok(undefined)),
    };
  });

  afterEach(() => {
    cleanup?.();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe("register()", () => {
    it("should register init event via PlatformBootstrapEventPort", () => {
      const service = new BootstrapInitHookService(mockLogger, mockContainer, mockBootstrapEvents);
      service.register();

      expect(mockBootstrapEvents.onInit).toHaveBeenCalledWith(expect.any(Function));
    });

    it("should warn when event registration fails", () => {
      const failingBootstrapEvents: PlatformBootstrapEventPort = {
        onInit: vi.fn().mockReturnValue(
          err({
            code: "PLATFORM_NOT_AVAILABLE",
            message: "Hooks not available",
          })
        ),
        onReady: vi.fn().mockReturnValue(ok(undefined)),
      };

      const service = new BootstrapInitHookService(
        mockLogger,
        mockContainer,
        failingBootstrapEvents
      );
      service.register();

      expect(mockLogger.warn).toHaveBeenCalledWith(
        "Init hook registration failed: Hooks not available",
        undefined
      );
    });

    it("should execute init callback and expose API", async () => {
      const mockApiInitializer = {
        expose: vi.fn().mockReturnValue(ok(undefined)),
      };

      const mockSettingsRegistrar = {
        registerAll: vi.fn(),
      };

      const mockEventRegistrar = {
        registerAll: vi.fn().mockReturnValue(ok(undefined)),
      };

      (mockContainer.resolveWithError as any).mockImplementation((token: symbol) => {
        if (token === moduleApiInitializerToken) {
          return ok(mockApiInitializer);
        }
        if (token === moduleSettingsRegistrarToken) {
          return ok(mockSettingsRegistrar);
        }
        if (token === moduleEventRegistrarToken) {
          return ok(mockEventRegistrar);
        }
        if (token === foundrySettingsToken) {
          return err({ code: "NotFound", message: "Settings not available" });
        }
        return err({ code: "NotFound", message: "Token not found" });
      });

      const service = new BootstrapInitHookService(mockLogger, mockContainer, mockBootstrapEvents);
      service.register();

      expect(capturedInitCallback).toBeDefined();
      capturedInitCallback!();

      expect(mockLogger.info).toHaveBeenCalledWith("init-phase");
      expect(mockApiInitializer.expose).toHaveBeenCalledWith(mockContainer);
      expect(mockSettingsRegistrar.registerAll).toHaveBeenCalled();
      expect(mockEventRegistrar.registerAll).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith("init-phase completed");
    });

    it("should handle ModuleApiInitializer resolution failure", async () => {
      (mockContainer.resolveWithError as any).mockImplementation((token: symbol) => {
        if (token === moduleApiInitializerToken) {
          return err({
            code: "DependencyResolveFailed" as const,
            message: "ModuleApiInitializer not found",
          });
        }
        return err({ code: "NotFound", message: "Token not found" });
      });

      const service = new BootstrapInitHookService(mockLogger, mockContainer, mockBootstrapEvents);
      service.register();

      expect(capturedInitCallback).toBeDefined();
      capturedInitCallback!();

      expect(mockLogger.error).toHaveBeenCalledWith(
        "Failed to expose API: Failed to resolve ModuleApiInitializer: ModuleApiInitializer not found"
      );
      expect(mockLogger.info).not.toHaveBeenCalledWith("init-phase completed");
    });

    it("should attach UI channel to NotificationCenter when available", async () => {
      const mockNotificationCenter = {
        addChannel: vi.fn(),
      };

      const mockUIChannel = {
        name: "UIChannel",
      };

      const mockApiInitializer = {
        expose: vi.fn().mockReturnValue(ok(undefined)),
      };

      const mockSettingsRegistrar = {
        registerAll: vi.fn(),
      };

      const mockEventRegistrar = {
        registerAll: vi.fn().mockReturnValue(ok(undefined)),
      };

      (mockContainer.resolveWithError as any).mockImplementation((token: symbol) => {
        if (token === notificationCenterToken) {
          return ok(mockNotificationCenter);
        }
        if (token === uiChannelToken) {
          return ok(mockUIChannel);
        }
        if (token === moduleApiInitializerToken) {
          return ok(mockApiInitializer);
        }
        if (token === moduleSettingsRegistrarToken) {
          return ok(mockSettingsRegistrar);
        }
        if (token === moduleEventRegistrarToken) {
          return ok(mockEventRegistrar);
        }
        if (token === foundrySettingsToken) {
          return err({ code: "NotFound", message: "Settings not available" });
        }
        return err({ code: "NotFound", message: "Token not found" });
      });

      const service = new BootstrapInitHookService(mockLogger, mockContainer, mockBootstrapEvents);
      service.register();

      expect(capturedInitCallback).toBeDefined();
      capturedInitCallback!();

      expect(mockNotificationCenter.addChannel).toHaveBeenCalledWith(mockUIChannel);
    });

    it("should warn when NotificationCenter cannot be resolved", async () => {
      const mockApiInitializer = {
        expose: vi.fn().mockReturnValue(ok(undefined)),
      };

      const mockSettingsRegistrar = {
        registerAll: vi.fn(),
      };

      const mockEventRegistrar = {
        registerAll: vi.fn().mockReturnValue(ok(undefined)),
      };

      (mockContainer.resolveWithError as any).mockImplementation((token: symbol) => {
        if (token === notificationCenterToken) {
          return err({
            code: "DependencyResolveFailed" as const,
            message: "NotificationCenter not found",
          });
        }
        if (token === moduleApiInitializerToken) {
          return ok(mockApiInitializer);
        }
        if (token === moduleSettingsRegistrarToken) {
          return ok(mockSettingsRegistrar);
        }
        if (token === moduleEventRegistrarToken) {
          return ok(mockEventRegistrar);
        }
        if (token === foundrySettingsToken) {
          return err({ code: "NotFound", message: "Settings not available" });
        }
        return err({ code: "NotFound", message: "Token not found" });
      });

      const service = new BootstrapInitHookService(mockLogger, mockContainer, mockBootstrapEvents);
      service.register();

      expect(capturedInitCallback).toBeDefined();
      capturedInitCallback!();

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining("Notification channels could not be attached"),
        expect.objectContaining({ phase: "notification-channels" })
      );
    });

    it("should register context menu libWrapper and callbacks successfully", async () => {
      const mockApiInitializer = {
        expose: vi.fn().mockReturnValue(ok(undefined)),
      };

      const mockSettingsRegistrar = {
        registerAll: vi.fn(),
      };

      const mockEventRegistrar = {
        registerAll: vi.fn().mockReturnValue(ok(undefined)),
      };

      const mockContextMenuLibWrapperService = {
        register: vi.fn().mockReturnValue(ok(undefined)),
      };

      const mockContextMenuUseCase = {
        register: vi.fn().mockReturnValue(ok(undefined)),
      };

      (mockContainer.resolveWithError as any).mockImplementation((token: symbol) => {
        if (token === moduleApiInitializerToken) {
          return ok(mockApiInitializer);
        }
        if (token === moduleSettingsRegistrarToken) {
          return ok(mockSettingsRegistrar);
        }
        if (token === moduleEventRegistrarToken) {
          return ok(mockEventRegistrar);
        }
        if (token === journalContextMenuLibWrapperServiceToken) {
          return ok(mockContextMenuLibWrapperService);
        }
        if (token === registerContextMenuUseCaseToken) {
          return ok(mockContextMenuUseCase);
        }
        if (token === foundrySettingsToken) {
          return err({ code: "NotFound", message: "Settings not available" });
        }
        return err({ code: "NotFound", message: "Token not found" });
      });

      const service = new BootstrapInitHookService(mockLogger, mockContainer, mockBootstrapEvents);
      service.register();

      expect(capturedInitCallback).toBeDefined();
      capturedInitCallback!();

      expect(mockContextMenuLibWrapperService.register).toHaveBeenCalled();
      expect(mockContextMenuUseCase.register).toHaveBeenCalled();
      // Context menu registration is now handled by ContextMenuBootstrapper
      // No specific debug messages expected - success is silent
    });

    it("should warn when context menu use case registration fails", async () => {
      const mockApiInitializer = {
        expose: vi.fn().mockReturnValue(ok(undefined)),
      };

      const mockSettingsRegistrar = {
        registerAll: vi.fn(),
      };

      const mockEventRegistrar = {
        registerAll: vi.fn().mockReturnValue(ok(undefined)),
      };

      const mockContextMenuLibWrapperService = {
        register: vi.fn().mockReturnValue(ok(undefined)),
      };

      const mockContextMenuUseCase = {
        register: vi.fn().mockReturnValue(err(new Error("Registration failed"))),
      };

      (mockContainer.resolveWithError as any).mockImplementation((token: symbol) => {
        if (token === moduleApiInitializerToken) {
          return ok(mockApiInitializer);
        }
        if (token === moduleSettingsRegistrarToken) {
          return ok(mockSettingsRegistrar);
        }
        if (token === moduleEventRegistrarToken) {
          return ok(mockEventRegistrar);
        }
        if (token === journalContextMenuLibWrapperServiceToken) {
          return ok(mockContextMenuLibWrapperService);
        }
        if (token === registerContextMenuUseCaseToken) {
          return ok(mockContextMenuUseCase);
        }
        if (token === foundrySettingsToken) {
          return err({ code: "NotFound", message: "Settings not available" });
        }
        return err({ code: "NotFound", message: "Token not found" });
      });

      const service = new BootstrapInitHookService(mockLogger, mockContainer, mockBootstrapEvents);
      service.register();

      expect(capturedInitCallback).toBeDefined();
      capturedInitCallback!();

      expect(mockContextMenuLibWrapperService.register).toHaveBeenCalled();
      expect(mockContextMenuUseCase.register).toHaveBeenCalled();
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining("Context menu registration failed")
      );
    });

    it("should warn when context menu use case cannot be resolved", async () => {
      const mockApiInitializer = {
        expose: vi.fn().mockReturnValue(ok(undefined)),
      };

      const mockSettingsRegistrar = {
        registerAll: vi.fn(),
      };

      const mockEventRegistrar = {
        registerAll: vi.fn().mockReturnValue(ok(undefined)),
      };

      const mockContextMenuLibWrapperService = {
        register: vi.fn().mockReturnValue(ok(undefined)),
      };

      (mockContainer.resolveWithError as any).mockImplementation((token: symbol) => {
        if (token === moduleApiInitializerToken) {
          return ok(mockApiInitializer);
        }
        if (token === moduleSettingsRegistrarToken) {
          return ok(mockSettingsRegistrar);
        }
        if (token === moduleEventRegistrarToken) {
          return ok(mockEventRegistrar);
        }
        if (token === journalContextMenuLibWrapperServiceToken) {
          return ok(mockContextMenuLibWrapperService);
        }
        if (token === registerContextMenuUseCaseToken) {
          return err({
            code: "DependencyResolveFailed" as const,
            message: "RegisterContextMenuUseCase not found",
          });
        }
        if (token === foundrySettingsToken) {
          return err({ code: "NotFound", message: "Settings not available" });
        }
        return err({ code: "NotFound", message: "Token not found" });
      });

      const service = new BootstrapInitHookService(mockLogger, mockContainer, mockBootstrapEvents);
      service.register();

      expect(capturedInitCallback).toBeDefined();
      capturedInitCallback!();

      expect(mockContextMenuLibWrapperService.register).toHaveBeenCalled();
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining("Context menu registration failed")
      );
    });
  });
});
