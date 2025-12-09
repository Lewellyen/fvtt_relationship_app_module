// Test file: `any` needed for mocking Foundry global objects (Hooks)

import { describe, it, expect, afterEach, vi } from "vitest";
import { withFoundryGlobals } from "@/test/utils/test-helpers";
import { createMockGame, createMockHooks } from "@/test/mocks/foundry";

describe("init-solid Hooks Guard", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules(); // KRITISCH: Modul neu laden
    vi.restoreAllMocks();
  });

  describe("Hooks NOT Available - Soft Abort", () => {
    it("should soft-abort when Hooks undefined and log warning", async () => {
      vi.resetModules();

      const mockGame = createMockGame();
      const cleanup = withFoundryGlobals({
        game: mockGame,
        Hooks: undefined,
      });

      // Spy auf Logger warn() um zu prüfen, dass die Warnung geloggt wird
      const consoleLoggerModule = await import("@/infrastructure/logging/ConsoleLoggerService");
      const warnSpy = vi
        .spyOn(consoleLoggerModule.ConsoleLoggerService.prototype, "warn")
        .mockImplementation(() => {});

      await import("@/framework/core/init-solid");

      // Prüfen dass logger.warn() mit der erwarteten Nachricht aufgerufen wurde
      // Services warnen jetzt über PlatformBootstrapEventPort für init und ready events
      expect(warnSpy).toHaveBeenCalledWith(
        "Init hook registration failed: Foundry Hooks API not available",
        undefined
      );
      expect(warnSpy).toHaveBeenCalledWith(
        "Ready hook registration failed: Foundry Hooks API not available",
        undefined
      );

      // Prüfen dass keine Hooks registriert wurden (weil Hooks undefined ist)
      expect((global as any).Hooks).toBeUndefined();

      // Prüfen dass initializeFoundryModule soft-abort gemacht hat
      // (keine Hooks.on() Aufrufe, da Hooks undefined ist)
      const hooksOnMock = (global as any).Hooks?.on;
      expect(hooksOnMock).toBeUndefined();

      warnSpy.mockRestore();
      cleanup();
    });

    it("should continue normally when Hooks is available", async () => {
      vi.resetModules();

      const mockGame = createMockGame();
      const mockHooks = createMockHooks();
      const cleanup = withFoundryGlobals({
        game: mockGame,
        Hooks: mockHooks,
      });

      const consoleLoggerModule = await import("@/infrastructure/logging/ConsoleLoggerService");
      const warnSpy = vi
        .spyOn(consoleLoggerModule.ConsoleLoggerService.prototype, "warn")
        .mockImplementation(() => {});

      await import("@/framework/core/init-solid");

      // Prüfen dass KEINE Warnung geloggt wurde (Hooks ist verfügbar)
      const hooksWarningCall = warnSpy.mock.calls.find((call) =>
        call[0]?.toString().includes("hook registration failed")
      );
      expect(hooksWarningCall).toBeUndefined();

      // Prüfen dass Hooks registriert wurden (weil Hooks verfügbar ist)
      const hooksOnMock = (global as any).Hooks.on as ReturnType<typeof vi.fn>;
      expect(hooksOnMock).toHaveBeenCalledWith("init", expect.any(Function));
      expect(hooksOnMock).toHaveBeenCalledWith("ready", expect.any(Function));

      warnSpy.mockRestore();
      cleanup();
    });
  });
});
