/* eslint-disable @typescript-eslint/no-explicit-any */
// Test file: `any` needed for mocking Foundry global objects (game, Hooks, ui)

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { withFoundryGlobals } from "@/test/utils/test-helpers";
import { createMockGame, createMockHooks, createMockUI } from "@/test/mocks/foundry";
import { MODULE_CONSTANTS } from "@/infrastructure/shared/constants";
import { LogLevel } from "@/domain/types/log-level";
import { expectResultOk } from "@/test/utils/test-helpers";
import type { Logger } from "@/infrastructure/logging/logger.interface";

describe("Integration: Settings Change + Service Reaction", () => {
  let cleanup: (() => void) | undefined;
  let mockSettingsOnChange: ((value: number) => void) | undefined;

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    cleanup?.();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("should update service level when setting changes", async () => {
    // 1. Setup Settings Mock
    const mockSettingsGet = vi.fn().mockReturnValue(LogLevel.INFO);
    const mockSettingsSet = vi.fn();

    const mockGame = createMockGame({ version: "13.350" });
    const mockModule = {
      api: undefined as unknown,
    };
    if (mockGame.modules) {
      mockGame.modules.set(MODULE_CONSTANTS.MODULE.ID, mockModule as any);
    }

    // Settings-Mock mit onChange Callback-Speicherung
    const mockSettingsRegister = vi.fn((moduleId, key, config) => {
      // onChange Callback speichern (nur für logLevel setting)
      if (key === MODULE_CONSTANTS.SETTINGS.LOG_LEVEL && config.onChange) {
        mockSettingsOnChange = config.onChange as (value: number) => void;
      }
      return { ok: true as const, value: undefined };
    });

    // game.settings zu mockGame hinzufügen
    const gameWithSettings = {
      ...mockGame,
      settings: {
        get: mockSettingsGet,
        set: mockSettingsSet,
        register: mockSettingsRegister,
      },
    };

    vi.stubGlobal("game", gameWithSettings);

    cleanup = withFoundryGlobals({
      game: gameWithSettings as any,
      Hooks: createMockHooks(),
      ui: createMockUI(),
    });

    // 2. init-solid importieren (triggert Bootstrap und Hook-Registrierung)
    await import("@/framework/core/init-solid");

    // 3. Logger-Service vor init Hook resolven und spyen
    // WICHTIG: Logger muss vor init Hook geholt werden, damit es die gleiche Instanz ist,
    // die bei der Settings-Registrierung verwendet wird
    const { getRootContainer } = await import("@/framework/core/init-solid");
    const { loggerToken } = await import("@/infrastructure/shared/tokens");

    const containerResultBeforeInit = getRootContainer();
    expectResultOk(containerResultBeforeInit);
    const containerBeforeInit = containerResultBeforeInit.value;

    const loggerResultBeforeInit = containerBeforeInit.resolveWithError(loggerToken);
    expectResultOk(loggerResultBeforeInit);
    const logger = loggerResultBeforeInit.value as Logger;

    // Spy auf setMinLevel setzen BEVOR init Hook gefeuert wird
    const setMinLevelSpy = vi.spyOn(logger, "setMinLevel");

    // 4. init Hook feuern (registriert Settings mit dem Logger)
    const hooksOnMock = (global as any).Hooks.on as ReturnType<typeof vi.fn>;
    const initCall = hooksOnMock.mock.calls.find(
      ([hookName]) => hookName === MODULE_CONSTANTS.HOOKS.INIT
    );
    const initCallback = initCall?.[1] as (() => void) | undefined;
    expect(initCallback).toBeDefined();
    initCallback!();

    // 5. Prüfen dass Setting registriert wurde (nach init Hook)
    expect(mockSettingsRegister).toHaveBeenCalledWith(
      MODULE_CONSTANTS.MODULE.ID,
      MODULE_CONSTANTS.SETTINGS.LOG_LEVEL,
      expect.objectContaining({
        onChange: expect.any(Function),
      })
    );

    // 6. Setting ändern (simuliert Foundry Setting-Änderung)
    mockSettingsGet.mockReturnValue(LogLevel.WARN);

    // 7. Prüfen ob Logger-Instanz die gleiche ist
    // Logger sollte als Singleton registriert sein, also sollte es die gleiche Instanz sein
    const loggerAfterInitResult = containerBeforeInit.resolveWithError(loggerToken);
    expectResultOk(loggerAfterInitResult);
    const loggerAfterInit = loggerAfterInitResult.value as Logger;

    // Prüfen ob es die gleiche Instanz ist
    expect(loggerAfterInit).toBe(logger);

    // Spy sollte auf beide Instanzen wirken (sind die gleiche)
    expect(setMinLevelSpy).toBeDefined();

    // 8. onChange Callback manuell ausführen
    // WICHTIG: Der onChange Callback ist ein Wrapper aus attachRuntimeConfigBridge,
    // der zuerst runtimeConfig.setFromFoundry() aufruft, dann originalOnChange
    // originalOnChange ruft validateAndSetLogLevel(value, logger) auf
    // validateAndSetLogLevel ruft dann logger.setMinLevel auf
    expect(mockSettingsOnChange).toBeDefined();
    if (mockSettingsOnChange) {
      mockSettingsOnChange(LogLevel.WARN);
    }

    // 9. Prüfen ob Service-Level aktualisiert wurde
    // WICHTIG: validateAndSetLogLevel ruft logger.setMinLevel nur auf, wenn logger.setMinLevel existiert
    // Der Logger muss die gleiche Instanz sein, die im onChange Callback verwendet wird
    expect(setMinLevelSpy).toHaveBeenCalledWith(LogLevel.WARN);
  });
});
