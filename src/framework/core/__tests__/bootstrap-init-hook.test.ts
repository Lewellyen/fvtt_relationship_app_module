/* eslint-disable @typescript-eslint/no-explicit-any */
// Test file: `any` needed for mocking Foundry global objects (game, Hooks, ui)

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { BootstrapInitHookService } from "@/framework/core/bootstrap-init-hook";
import type { Logger } from "@/infrastructure/logging/logger.interface";
import type { ServiceContainer } from "@/infrastructure/di/container";
import { createMockGame, createMockHooks, createMockUI } from "@/test/mocks/foundry";
import { withFoundryGlobals } from "@/test/utils/test-helpers";
import { MODULE_CONSTANTS } from "@/infrastructure/shared/constants";
import {
  notificationCenterToken,
  uiChannelToken,
  moduleApiInitializerToken,
  moduleSettingsRegistrarToken,
  foundrySettingsToken,
  moduleEventRegistrarToken,
  journalContextMenuLibWrapperServiceToken,
  registerContextMenuUseCaseToken,
} from "@/infrastructure/shared/tokens";
import { ok, err } from "@/infrastructure/shared/utils/result";

describe("BootstrapInitHookService", () => {
  let mockLogger: Logger;
  let mockContainer: ServiceContainer;
  let cleanup: (() => void) | undefined;

  beforeEach(() => {
    vi.resetModules();

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
    mockGame.modules?.set(MODULE_CONSTANTS.MODULE.ID, mockModule as any);

    cleanup = withFoundryGlobals({
      game: mockGame,
      Hooks: createMockHooks(),
      ui: createMockUI(),
    });

    mockContainer = {
      resolveWithError: vi.fn(),
    } as unknown as ServiceContainer;
  });

  afterEach(() => {
    cleanup?.();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe("register()", () => {
    it("should register init hook with Hooks.on()", () => {
      const service = new BootstrapInitHookService(mockLogger, mockContainer);
      service.register();

      const hooksOnMock = (global as any).Hooks.on as ReturnType<typeof vi.fn>;
      expect(hooksOnMock).toHaveBeenCalledWith("init", expect.any(Function));
    });

    it("should skip registration when Hooks API is not available", () => {
      vi.unstubAllGlobals();
      delete (global as any).Hooks;

      const service = new BootstrapInitHookService(mockLogger, mockContainer);
      service.register();

      expect(mockLogger.warn).toHaveBeenCalledWith(
        "Foundry Hooks API not available - init hook registration skipped"
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

      const service = new BootstrapInitHookService(mockLogger, mockContainer);
      service.register();

      const hooksOnMock = (global as any).Hooks.on as ReturnType<typeof vi.fn>;
      const initCall = hooksOnMock.mock.calls.find(([hookName]) => hookName === "init");
      const initCallback = initCall?.[1] as (() => void) | undefined;

      expect(initCallback).toBeDefined();
      initCallback!();

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

      const service = new BootstrapInitHookService(mockLogger, mockContainer);
      service.register();

      const hooksOnMock = (global as any).Hooks.on as ReturnType<typeof vi.fn>;
      const initCall = hooksOnMock.mock.calls.find(([hookName]) => hookName === "init");
      const initCallback = initCall?.[1] as (() => void) | undefined;

      expect(initCallback).toBeDefined();
      initCallback!();

      expect(mockLogger.error).toHaveBeenCalledWith(
        "Failed to resolve ModuleApiInitializer: ModuleApiInitializer not found"
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

      const service = new BootstrapInitHookService(mockLogger, mockContainer);
      service.register();

      const hooksOnMock = (global as any).Hooks.on as ReturnType<typeof vi.fn>;
      const initCall = hooksOnMock.mock.calls.find(([hookName]) => hookName === "init");
      const initCallback = initCall?.[1] as (() => void) | undefined;

      expect(initCallback).toBeDefined();
      initCallback!();

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

      const service = new BootstrapInitHookService(mockLogger, mockContainer);
      service.register();

      const hooksOnMock = (global as any).Hooks.on as ReturnType<typeof vi.fn>;
      const initCall = hooksOnMock.mock.calls.find(([hookName]) => hookName === "init");
      const initCallback = initCall?.[1] as (() => void) | undefined;

      expect(initCallback).toBeDefined();
      initCallback!();

      expect(mockLogger.warn).toHaveBeenCalledWith(
        "NotificationCenter could not be resolved during init; UI channel not attached",
        expect.objectContaining({ message: "NotificationCenter not found" })
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

      const service = new BootstrapInitHookService(mockLogger, mockContainer);
      service.register();

      const hooksOnMock = (global as any).Hooks.on as ReturnType<typeof vi.fn>;
      const initCall = hooksOnMock.mock.calls.find(([hookName]) => hookName === "init");
      const initCallback = initCall?.[1] as (() => void) | undefined;

      expect(initCallback).toBeDefined();
      initCallback!();

      expect(mockContextMenuLibWrapperService.register).toHaveBeenCalled();
      expect(mockLogger.debug).toHaveBeenCalledWith(
        "Context menu libWrapper registered successfully"
      );
      expect(mockContextMenuUseCase.register).toHaveBeenCalled();
      expect(mockLogger.debug).toHaveBeenCalledWith(
        "Context menu callbacks registered successfully"
      );
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

      const service = new BootstrapInitHookService(mockLogger, mockContainer);
      service.register();

      const hooksOnMock = (global as any).Hooks.on as ReturnType<typeof vi.fn>;
      const initCall = hooksOnMock.mock.calls.find(([hookName]) => hookName === "init");
      const initCallback = initCall?.[1] as (() => void) | undefined;

      expect(initCallback).toBeDefined();
      initCallback!();

      expect(mockContextMenuLibWrapperService.register).toHaveBeenCalled();
      expect(mockContextMenuUseCase.register).toHaveBeenCalled();
      expect(mockLogger.warn).toHaveBeenCalledWith(
        "Failed to register context menu callbacks: Registration failed"
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

      const service = new BootstrapInitHookService(mockLogger, mockContainer);
      service.register();

      const hooksOnMock = (global as any).Hooks.on as ReturnType<typeof vi.fn>;
      const initCall = hooksOnMock.mock.calls.find(([hookName]) => hookName === "init");
      const initCallback = initCall?.[1] as (() => void) | undefined;

      expect(initCallback).toBeDefined();
      initCallback!();

      expect(mockContextMenuLibWrapperService.register).toHaveBeenCalled();
      expect(mockLogger.warn).toHaveBeenCalledWith(
        "Failed to resolve RegisterContextMenuUseCase: RegisterContextMenuUseCase not found"
      );
    });
  });
});
