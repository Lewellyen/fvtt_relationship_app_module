import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { withFoundryGlobals } from "@/test/utils/test-helpers";
import { createMockGame } from "@/test/mocks/foundry";
import { CompositionRoot } from "@/core/composition-root";
import { expectResultOk } from "@/test/utils/test-helpers";

describe("Runtime Error: Graceful Degradation", () => {
  let cleanup: (() => void) | undefined;

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    cleanup?.();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("should bootstrap even when Foundry APIs are partially missing", () => {
    const mockGame = createMockGame();
    // Teilweise APIs entfernen
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (mockGame as any).journal;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (mockGame as any).actors;

    cleanup = withFoundryGlobals({
      game: mockGame,
    });

    // Bootstrap sollte trotzdem funktionieren
    const root = new CompositionRoot();
    const bootstrapResult = root.bootstrap();

    // Sollte erfolgreich sein (Module sollte nicht crashen)
    expectResultOk(bootstrapResult);
  });

  it("should handle missing Hooks gracefully", () => {
    cleanup = withFoundryGlobals({
      game: createMockGame(),
      Hooks: undefined, // Hooks nicht verfügbar
    });

    // Bootstrap sollte trotzdem funktionieren
    const root = new CompositionRoot();
    const bootstrapResult = root.bootstrap();

    // Sollte erfolgreich sein oder Fehler zurückgeben, nicht crashen
    if (!bootstrapResult.ok) {
      expect(bootstrapResult.error).toBeDefined();
    }
  });
});
