// Test file: `any` needed for mocking Foundry global objects (game, Hooks, ui)

import { describe, it, expect, beforeEach, vi } from "vitest";
import { ModuleReadyService } from "@/application/services/module-ready-service";
import type { PlatformModuleReadyPort } from "@/domain/ports/platform-module-ready-port.interface";
import type { Logger } from "@/infrastructure/logging/logger.interface";
import { ok, err } from "@/domain/utils/result";

describe("ModuleReadyService", () => {
  let mockModuleReadyPort: PlatformModuleReadyPort;
  let mockLogger: Logger;

  beforeEach(() => {
    vi.resetModules();

    mockModuleReadyPort = {
      setReady: vi.fn().mockReturnValue(ok(undefined)),
    } as unknown as PlatformModuleReadyPort;

    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
      setMinLevel: vi.fn(),
    } as unknown as Logger;
  });

  describe("setReady()", () => {
    it("should call moduleReadyPort.setReady() and log success", () => {
      const service = new ModuleReadyService(mockModuleReadyPort, mockLogger);
      service.setReady();

      expect(mockModuleReadyPort.setReady).toHaveBeenCalledOnce();
      expect(mockLogger.info).toHaveBeenCalledWith("module.ready set to true");
      expect(mockLogger.warn).not.toHaveBeenCalled();
    });

    it("should log warning when moduleReadyPort.setReady() fails", () => {
      const failingPort: PlatformModuleReadyPort = {
        setReady: vi.fn().mockReturnValue(
          err({
            code: "MODULE_NOT_FOUND",
            message: "Module not found",
          })
        ),
      } as unknown as PlatformModuleReadyPort;

      const service = new ModuleReadyService(failingPort, mockLogger);
      service.setReady();

      expect(failingPort.setReady).toHaveBeenCalledOnce();
      expect(mockLogger.warn).toHaveBeenCalledWith(
        "Failed to set module.ready: Module not found",
        undefined
      );
      expect(mockLogger.info).not.toHaveBeenCalledWith("module.ready set to true");
    });

    it("should log warning with details when error has details", () => {
      const failingPort: PlatformModuleReadyPort = {
        setReady: vi.fn().mockReturnValue(
          err({
            code: "PLATFORM_NOT_AVAILABLE",
            message: "Platform not available",
            details: { reason: "Game not initialized" },
          })
        ),
      } as unknown as PlatformModuleReadyPort;

      const service = new ModuleReadyService(failingPort, mockLogger);
      service.setReady();

      expect(mockLogger.warn).toHaveBeenCalledWith(
        "Failed to set module.ready: Platform not available",
        { reason: "Game not initialized" }
      );
    });
  });
});
