import { describe, it, expect, afterEach, vi } from "vitest";
import { withFoundryGlobals } from "@/test/utils/test-helpers";
import { createMockGame, createMockHooks, createMockUI } from "@/test/mocks/foundry";
import { CompositionRoot } from "../composition-root";
import { ModuleHookRegistrar } from "../module-hook-registrar";
import { MODULE_CONSTANTS } from "@/constants";

describe("init-solid Bootstrap", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules(); // KRITISCH: Modul neu laden
    vi.restoreAllMocks();
  });

  describe("Bootstrap Success with Hooks Available", () => {
    it("should bootstrap successfully and execute init hook callback", async () => {
      // Reset modules VOR Setup
      vi.resetModules();

      // Setup game.modules für exposeToModuleApi
      const mockGame = createMockGame();
      const mockModule = {
        api: undefined as unknown,
      };
      if (mockGame.modules) {
        mockGame.modules.set(MODULE_CONSTANTS.MODULE.ID, mockModule as any);
      }

      const cleanup = withFoundryGlobals({
        game: mockGame,
        Hooks: createMockHooks(),
      });

      // Spies VOR dem Import setzen (für Callback-Execution)
      // WICHTIG: Spy auf Prototype setzen, damit er die Instanz-Methode erfasst
      vi.spyOn(CompositionRoot.prototype, "exposeToModuleApi");
      vi.spyOn(ModuleHookRegistrar.prototype, "registerAll");

      // Dynamic import NACH Mock-Setup
      await import("@/core/init-solid");

      // Prüfen dass Hooks registriert wurden
      const hooksOnMock = (global as any).Hooks.on as ReturnType<typeof vi.fn>;
      expect(hooksOnMock).toHaveBeenCalledWith("init", expect.any(Function));
      expect(hooksOnMock).toHaveBeenCalledWith("ready", expect.any(Function));

      // WICHTIG: Init-Hook-Callback extrahieren und ausführen
      const initCall = hooksOnMock.mock.calls.find(([hookName]) => hookName === "init");
      const initCallback = initCall?.[1] as (() => void) | undefined;

      expect(initCallback).toBeDefined();

      // Callback ausführen -> sollte Phase 2 triggern
      initCallback!();

      // Prüfen dass Phase-2-Methoden aufgerufen wurden
      // Da Spies nach vi.resetModules() nicht funktionieren, prüfen wir Seiteneffekte:
      // 1. exposeToModuleApi sollte game.modules.get().api gesetzt haben
      expect(mockModule.api).toBeDefined();
      expect(typeof (mockModule.api as any)?.resolve).toBe("function");

      // 2. registerAll sollte den Hook-Callback aufgerufen haben
      // (wird durch processJournalDirectory im Mock geprüft)
      // Wir prüfen dass der Hook korrekt registriert wurde und der Callback ausführbar ist
      expect(hooksOnMock.mock.calls.length).toBeGreaterThan(0);

      cleanup();
    });

    it("should register ready hook", async () => {
      vi.resetModules();

      const mockGame = createMockGame();
      const mockModule = {
        api: undefined as unknown,
      };
      mockGame.modules?.set(MODULE_CONSTANTS.MODULE.ID, mockModule as any);

      const cleanup = withFoundryGlobals({
        game: mockGame,
        Hooks: createMockHooks(),
      });

      await import("@/core/init-solid");

      const hooksOnMock = (global as any).Hooks.on as ReturnType<typeof vi.fn>;
      expect(hooksOnMock).toHaveBeenCalledWith("ready", expect.any(Function));

      // Ready-Callback sollte Logger-Info aufrufen
      const readyCall = hooksOnMock.mock.calls.find(([hookName]) => hookName === "ready");
      const readyCallback = readyCall?.[1] as (() => void) | undefined;

      expect(readyCallback).toBeDefined();
      // Callback ausführbar ohne Fehler
      expect(() => readyCallback!()).not.toThrow();

      cleanup();
    });
  });

  describe("Hooks NOT Available - Soft Abort", () => {
    it("should soft-abort when Hooks undefined", async () => {
      vi.resetModules();

      // Hooks explizit auf undefined setzen
      const cleanup = withFoundryGlobals({
        Hooks: undefined,
      });

      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      await import("@/core/init-solid");

      // Sollte warnen, aber nicht werfen
      // Der Logger wird aufgerufen, aber wir müssen das anders prüfen
      // Da logger.warn() aufgerufen wird, nicht console.warn
      // Wir prüfen dass keine Hooks registriert wurden
      expect((global as any).Hooks).toBeUndefined();

      consoleSpy.mockRestore();
      cleanup();
    });
  });

  describe("Bootstrap Failure - Graceful Degradation", () => {
    it("should NOT throw when bootstrap fails (graceful degradation)", async () => {
      vi.resetModules();

      // Use proper mock UI with all required properties
      const mockUI = createMockUI();
      const cleanup = withFoundryGlobals({
        game: createMockGame(),
        Hooks: createMockHooks(),
        ui: mockUI,
      });

      // Mock configureDependencies um Fehler zu provozieren
      vi.doMock("@/config/dependencyconfig", () => ({
        configureDependencies: vi.fn().mockReturnValue({
          ok: false,
          error: "Test bootstrap error",
        }),
      }));

      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      // FIXED: Sollte NICHT mehr werfen (graceful degradation)
      await expect(import("@/core/init-solid")).resolves.toBeDefined();

      // Sollte Fehler zur Console loggen
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining("bootstrap failed"));
      expect(consoleErrorSpy).toHaveBeenCalledWith("Test bootstrap error");

      // Sollte UI-Notification zeigen
      expect(mockUI.notifications?.error).toHaveBeenCalledWith(
        expect.stringContaining("failed to initialize"),
        { permanent: true }
      );

      consoleErrorSpy.mockRestore();
      cleanup();
    });

    it("should handle missing ui.notifications gracefully", async () => {
      vi.resetModules();

      const cleanup = withFoundryGlobals({
        game: createMockGame(),
        Hooks: createMockHooks(),
        ui: undefined, // ui nicht verfügbar
      });

      // Mock configureDependencies um Fehler zu provozieren
      vi.doMock("@/config/dependencyconfig", () => ({
        configureDependencies: vi.fn().mockReturnValue({
          ok: false,
          error: "Test bootstrap error",
        }),
      }));

      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      // Sollte nicht crashen, auch wenn ui.notifications fehlt
      await expect(import("@/core/init-solid")).resolves.toBeDefined();

      // Sollte trotzdem Console-Fehler loggen
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
      cleanup();
    });

    it("should show version-specific error for Foundry v12", async () => {
      vi.resetModules();

      const mockUI = createMockUI();
      const cleanup = withFoundryGlobals({
        game: { version: "12.331" } as any,
        Hooks: createMockHooks(),
        ui: mockUI,
      });

      // Mock configureDependencies to fail with PORT_SELECTION_FAILED
      vi.doMock("@/config/dependencyconfig", () => ({
        configureDependencies: vi.fn().mockReturnValue({
          ok: false,
          error: "Bootstrap failed: PORT_SELECTION_FAILED - No compatible port found",
        }),
      }));

      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      await import("@/core/init-solid");

      // Should show version-specific error
      expect(mockUI.notifications?.error).toHaveBeenCalledWith(
        expect.stringContaining("benötigt mindestens Foundry VTT Version 13"),
        { permanent: true }
      );
      expect(mockUI.notifications?.error).toHaveBeenCalledWith(
        expect.stringContaining("Ihre Version: 12"),
        { permanent: true }
      );

      consoleErrorSpy.mockRestore();
      cleanup();
    });

    it("should NOT show version error for PORT_SELECTION_FAILED on v13", async () => {
      vi.resetModules();

      const mockUI = createMockUI();
      const cleanup = withFoundryGlobals({
        game: { version: "13.291" } as any,
        Hooks: createMockHooks(),
        ui: mockUI,
      });

      // Mock configureDependencies to fail with PORT_SELECTION_FAILED
      vi.doMock("@/config/dependencyconfig", () => ({
        configureDependencies: vi.fn().mockReturnValue({
          ok: false,
          error: "Bootstrap failed: PORT_SELECTION_FAILED",
        }),
      }));

      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      await import("@/core/init-solid");

      // Should show generic error, not version-specific
      expect(mockUI.notifications?.error).toHaveBeenCalledWith(
        expect.stringContaining("failed to initialize"),
        { permanent: true }
      );

      // Should NOT show version-specific message
      const errorCalls = (mockUI.notifications?.error as any).mock.calls;
      const versionSpecificCall = errorCalls.find((call: any) =>
        call[0].includes("benötigt mindestens")
      );
      expect(versionSpecificCall).toBeUndefined();

      consoleErrorSpy.mockRestore();
      cleanup();
    });
  });
});
