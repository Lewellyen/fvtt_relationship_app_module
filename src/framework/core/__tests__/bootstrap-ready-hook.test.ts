/* eslint-disable @typescript-eslint/no-explicit-any */
// Test file: `any` needed for mocking Foundry global objects (game, Hooks, ui)

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { BootstrapReadyHookService } from "@/framework/core/bootstrap-ready-hook";
import type { Logger } from "@/infrastructure/logging/logger.interface";
import { createMockGame, createMockHooks } from "@/test/mocks/foundry";
import { withFoundryGlobals } from "@/test/utils/test-helpers";

describe("BootstrapReadyHookService", () => {
  let mockLogger: Logger;
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

    cleanup = withFoundryGlobals({
      game: createMockGame(),
      Hooks: createMockHooks(),
    });
  });

  afterEach(() => {
    cleanup?.();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe("register()", () => {
    it("should register ready hook with Hooks.on()", () => {
      const service = new BootstrapReadyHookService(mockLogger);
      service.register();

      const hooksOnMock = (global as any).Hooks.on as ReturnType<typeof vi.fn>;
      expect(hooksOnMock).toHaveBeenCalledWith("ready", expect.any(Function));
    });

    it("should skip registration when Hooks API is not available", () => {
      vi.unstubAllGlobals();
      delete (global as any).Hooks;

      const service = new BootstrapReadyHookService(mockLogger);
      service.register();

      expect(mockLogger.warn).toHaveBeenCalledWith(
        "Foundry Hooks API not available - ready hook registration skipped"
      );
    });

    it("should execute ready callback and log messages", () => {
      const service = new BootstrapReadyHookService(mockLogger);
      service.register();

      const hooksOnMock = (global as any).Hooks.on as ReturnType<typeof vi.fn>;
      const readyCall = hooksOnMock.mock.calls.find(([hookName]) => hookName === "ready");
      const readyCallback = readyCall?.[1] as (() => void) | undefined;

      expect(readyCallback).toBeDefined();
      readyCallback!();

      expect(mockLogger.info).toHaveBeenCalledWith("ready-phase");
      expect(mockLogger.info).toHaveBeenCalledWith("ready-phase completed");
    });
  });
});
