/* eslint-disable @typescript-eslint/no-explicit-any */
// Test file: `any` needed for mocking Foundry global objects and container access

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { withFoundryGlobals } from "@/test/utils/test-helpers";
import { createMockGame } from "@/test/mocks/foundry";
import { CompositionRoot } from "@/framework/core/composition-root";
import { expectResultOk } from "@/test/utils/test-helpers";
import { foundryGameToken } from "@/infrastructure/shared/tokens/foundry/foundry-game.token";
import type { FoundryGame } from "@/infrastructure/adapters/foundry/interfaces/FoundryGame";
import type { ServiceContainer } from "@/infrastructure/di/container";

describe("Runtime Error: Result Pattern Consistency", () => {
  let cleanup: (() => void) | undefined;
  let container: ServiceContainer;

  beforeEach(async () => {
    vi.resetModules();

    cleanup = withFoundryGlobals({
      game: createMockGame(),
    });

    const root = new CompositionRoot();
    const bootstrapResult = root.bootstrap();
    expectResultOk(bootstrapResult);

    const containerResult = root.getContainer();
    expectResultOk(containerResult);
    container = containerResult.value;
  });

  afterEach(() => {
    cleanup?.();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("should never throw exceptions, always return Result for service methods that return Result", () => {
    // Alle Service-Methoden testen, die Result zurückgeben sollten
    const gameServiceResult = container.resolveWithError(foundryGameToken);
    expectResultOk(gameServiceResult);
    const gameService = gameServiceResult.value as FoundryGame;

    // Test FoundryGamePort methods
    const methods = [
      () => gameService.getJournalEntries(),
      () => gameService.getJournalEntryById("test-id"),
    ];

    methods.forEach((method) => {
      // Sollte nie Exception werfen
      expect(() => {
        const result = method();
        // Sollte immer Result sein
        expect(result).toHaveProperty("ok");
        expect(typeof result.ok).toBe("boolean");
      }).not.toThrow();
    });
  });

  it("should handle errors in Result pattern", () => {
    const gameServiceResult = container.resolveWithError(foundryGameToken);
    expectResultOk(gameServiceResult);
    const gameService = gameServiceResult.value as FoundryGame;

    // Fehler provozieren (undefined journal)
    const mockGame = createMockGame();

    delete (mockGame as any).journal;

    vi.stubGlobal("game", mockGame);

    const result = gameService.getJournalEntries();

    // Sollte Result sein, nicht Exception
    expect(result).toHaveProperty("ok");
    expect(result.ok).toBe(false);
    expect(result).toHaveProperty("error");
  });

  it("should note that api.resolve() is a deliberate exception", () => {
    // Hinweis: api.resolve() ist eine bewusste Ausnahme
    // Sie wirft Exceptions für externe Module (exception-basiertes Error Handling)
    // Diese Ausnahme wird in Test 5 (ModuleApi Error Handling) explizit getestet
    // Interne Services sollten immer Result-Pattern verwenden
    expect(true).toBe(true); // Placeholder für Dokumentation
  });
});
