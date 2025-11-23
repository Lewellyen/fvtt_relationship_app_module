import { describe, it, expect, afterEach, vi } from "vitest";
import {
  tryGetFoundryVersion,
  getFoundryVersionResult,
  resetVersionCache,
} from "@/infrastructure/adapters/foundry/versioning/versiondetector";
import { withFoundryGlobals } from "@/test/utils/test-helpers";
import { createMockGame } from "@/test/mocks/foundry";
import { expectResultOk, expectResultErr } from "@/test/utils/test-helpers";

describe("versiondetector", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    resetVersionCache(); // Clear version cache for test isolation
  });

  describe("getFoundryVersionResult", () => {
    describe("Success Cases", () => {
      it("should return Ok with version 13", () => {
        const cleanup = withFoundryGlobals({
          game: createMockGame({ version: "13.291" }),
        });

        const result = getFoundryVersionResult();
        expectResultOk(result);
        expect(result.value).toBe(13);

        cleanup();
      });

      it("should return Ok with version 14", () => {
        const cleanup = withFoundryGlobals({
          game: createMockGame({ version: "14.0" }),
        });

        const result = getFoundryVersionResult();
        expectResultOk(result);
        expect(result.value).toBe(14);

        cleanup();
      });

      it("should return Ok with version 15", () => {
        const cleanup = withFoundryGlobals({
          game: createMockGame({ version: "15.325" }),
        });

        const result = getFoundryVersionResult();
        expectResultOk(result);
        expect(result.value).toBe(15);

        cleanup();
      });

      it("should parse version with patch number", () => {
        const cleanup = withFoundryGlobals({
          game: createMockGame({ version: "13.348.2" }),
        });

        const result = getFoundryVersionResult();
        expectResultOk(result);
        expect(result.value).toBe(13);

        cleanup();
      });
    });

    describe("Error Cases", () => {
      it("should return Err when game is undefined", () => {
        vi.stubGlobal("game", undefined);

        const result = getFoundryVersionResult();
        expectResultErr(result);
        expect(result.error).toContain("Foundry game object is not available");

        vi.unstubAllGlobals();
      });

      it("should return Err when game.version is undefined", () => {
        const mockGame = createMockGame();
        Object.defineProperty(mockGame, "version", {
          value: undefined,
          writable: true,
          configurable: true,
        });

        const cleanup = withFoundryGlobals({
          game: mockGame,
        });

        const result = getFoundryVersionResult();
        expectResultErr(result);
        expect(result.error).toContain("Foundry version is not available");

        cleanup();
      });

      it("should return Err when game.version is empty string", () => {
        const mockGame = createMockGame({ version: "" });
        const cleanup = withFoundryGlobals({
          game: mockGame,
        });

        const result = getFoundryVersionResult();
        expectResultErr(result);
        expect(result.error).toContain("Foundry version is not available");

        cleanup();
      });

      it("should return Err when game.version contains non-numeric characters", () => {
        const cleanup = withFoundryGlobals({
          game: createMockGame({ version: "abc" }),
        });

        const result = getFoundryVersionResult();
        expectResultErr(result);
        expect(result.error).toContain("Could not parse Foundry version");

        cleanup();
      });

      it("should return Err when game.version is null", () => {
        const mockGame = createMockGame();
        Object.defineProperty(mockGame, "version", {
          value: null,
          writable: true,
          configurable: true,
        });

        const cleanup = withFoundryGlobals({
          game: mockGame,
        });

        const result = getFoundryVersionResult();
        expectResultErr(result);
        expect(result.error).toContain("Foundry version is not available");

        cleanup();
      });
    });

    describe("Version Cache", () => {
      it("should cache version after first call", () => {
        const mockGame = createMockGame({ version: "13.291" });
        const cleanup = withFoundryGlobals({ game: mockGame });

        // Access version property wird gespeichert
        const versionSpy = vi.spyOn(mockGame, "version", "get");

        getFoundryVersionResult();
        getFoundryVersionResult();

        // Version sollte nur einmal gelesen werden (gecached)
        expect(versionSpy).toHaveBeenCalledTimes(1);

        cleanup();
      });

      it("should use cached version even if game changes", () => {
        // First call with v13
        const cleanup1 = withFoundryGlobals({
          game: createMockGame({ version: "13.291" }),
        });

        const firstResult = getFoundryVersionResult();
        expectResultOk(firstResult);
        expect(firstResult.value).toBe(13);

        cleanup1();

        // Change game to v14, but cache should still return v13
        const cleanup2 = withFoundryGlobals({
          game: createMockGame({ version: "14.0" }),
        });

        const secondResult = getFoundryVersionResult();
        expectResultOk(secondResult);
        expect(secondResult.value).toBe(13); // Still cached value

        cleanup2();
      });

      it("should detect new version after resetVersionCache", () => {
        // First call with v13
        const cleanup1 = withFoundryGlobals({
          game: createMockGame({ version: "13.291" }),
        });

        const firstResult = getFoundryVersionResult();
        expectResultOk(firstResult);
        expect(firstResult.value).toBe(13);

        cleanup1();

        // Reset cache
        resetVersionCache();

        // Now v14 should be detected
        const cleanup2 = withFoundryGlobals({
          game: createMockGame({ version: "14.0" }),
        });

        const secondResult = getFoundryVersionResult();
        expectResultOk(secondResult);
        expect(secondResult.value).toBe(14); // New value after cache reset

        cleanup2();
      });
    });
  });

  describe("tryGetFoundryVersion", () => {
    it("should return version number on success", () => {
      const cleanup = withFoundryGlobals({
        game: createMockGame({ version: "13.291" }),
      });

      const result = tryGetFoundryVersion();
      expect(result).toBe(13);
      cleanup();
    });

    it("should return undefined on error (game undefined)", () => {
      vi.stubGlobal("game", undefined);

      const result = tryGetFoundryVersion();
      expect(result).toBeUndefined();

      vi.unstubAllGlobals();
    });

    it("should return undefined for invalid version", () => {
      const cleanup = withFoundryGlobals({
        game: createMockGame({ version: "invalid" }),
      });

      const result = tryGetFoundryVersion();
      expect(result).toBeUndefined();
      cleanup();
    });

    it("should return undefined when game.version is null", () => {
      const mockGame = createMockGame();
      Object.defineProperty(mockGame, "version", {
        value: null,
        writable: true,
        configurable: true,
      });

      const cleanup = withFoundryGlobals({
        game: mockGame,
      });

      const result = tryGetFoundryVersion();
      expect(result).toBeUndefined();
      cleanup();
    });
  });
});
