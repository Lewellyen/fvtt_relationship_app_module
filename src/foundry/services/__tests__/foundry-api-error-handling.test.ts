/* eslint-disable @typescript-eslint/no-explicit-any */
// Test file: `any` needed for mocking Foundry global objects and container access

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { withFoundryGlobals } from "@/test/utils/test-helpers";
import { createMockGame } from "@/test/mocks/foundry";
import { CompositionRoot } from "@/core/composition-root";
import { expectResultOk, expectResultErr } from "@/test/utils/test-helpers";
import { foundryGameToken } from "@/foundry/foundrytokens";
import type { FoundryGame } from "@/foundry/interfaces/FoundryGame";
import type { ServiceContainer } from "@/di_infrastructure/container";

describe("Runtime Error: Foundry API Failures", () => {
  let cleanup: (() => void) | undefined;
  let container: ServiceContainer;
  let gameService: FoundryGame;

  beforeEach(async () => {
    vi.resetModules();

    const root = new CompositionRoot();
    const bootstrapResult = root.bootstrap();
    expectResultOk(bootstrapResult);

    const containerResult = root.getContainer();
    expectResultOk(containerResult);
    container = containerResult.value;

    const gameServiceResult = container.resolveWithError(foundryGameToken);
    expectResultOk(gameServiceResult);
    gameService = gameServiceResult.value as FoundryGame;
  });

  afterEach(() => {
    cleanup?.();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("should handle undefined game.journal gracefully", () => {
    const mockGame = createMockGame();

    delete (mockGame as any).journal; // API nicht verfügbar

    cleanup = withFoundryGlobals({
      game: mockGame,
    });

    const result = gameService.getJournalEntries();

    // Sollte Result mit Fehler zurückgeben, nicht Exception
    expectResultErr(result);
    expect(result.error.code).toBe("API_NOT_AVAILABLE");
  });

  it("should handle game.journal.get throwing error", () => {
    const mockGame = createMockGame();
    if (mockGame.journal) {
      mockGame.journal.get = vi.fn().mockImplementation(() => {
        throw new Error("Journal API error");
      });
    }

    cleanup = withFoundryGlobals({
      game: mockGame,
    });

    const result = gameService.getJournalEntryById("test-id");

    expectResultErr(result);
    // Die Fehlermeldung kann variieren, wichtig ist dass Result zurückgegeben wird
    expect(result.error).toBeDefined();
    expect(result.error.message).toBeDefined();
  });

  it("should handle game.journal.contents being undefined", () => {
    const mockGame = createMockGame();
    if (mockGame.journal) {
      mockGame.journal.contents = undefined as any;
    }

    cleanup = withFoundryGlobals({
      game: mockGame,
    });

    const result = gameService.getJournalEntries();

    // Sollte leeres Array oder Fehler zurückgeben, nicht crashen
    if (result.ok) {
      expect(Array.isArray(result.value)).toBe(true);
    } else {
      expectResultErr(result);
    }
  });
});
