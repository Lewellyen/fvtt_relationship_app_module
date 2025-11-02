import { describe, it, expect, afterEach, vi } from "vitest";
import { getFoundryVersion, tryGetFoundryVersion } from "../versiondetector";
import { withFoundryGlobals } from "@/test/utils/test-helpers";
import { createMockGame } from "@/test/mocks/foundry";

describe("versiondetector", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("getFoundryVersion", () => {
    describe("Success Cases", () => {
      it("should detect version 13 from game.version", () => {
        const cleanup = withFoundryGlobals({
          game: createMockGame({ version: "13.291" }),
        });

        const version = getFoundryVersion();
        expect(version).toBe(13);

        cleanup();
      });

      it("should detect version 14 from game.version", () => {
        const cleanup = withFoundryGlobals({
          game: createMockGame({ version: "14.0" }),
        });

        const version = getFoundryVersion();
        expect(version).toBe(14);

        cleanup();
      });

      it("should detect version 15 from game.version", () => {
        const cleanup = withFoundryGlobals({
          game: createMockGame({ version: "15.325" }),
        });

        const version = getFoundryVersion();
        expect(version).toBe(15);

        cleanup();
      });

      it("should parse version with patch number", () => {
        const cleanup = withFoundryGlobals({
          game: createMockGame({ version: "13.348.2" }),
        });

        const version = getFoundryVersion();
        expect(version).toBe(13);

        cleanup();
      });
    });

    describe("Error Cases", () => {
      it("should throw when game is undefined", () => {
        vi.stubGlobal("game", undefined);

        expect(() => getFoundryVersion()).toThrow("Foundry game object is not available");

        vi.unstubAllGlobals();
      });

      it("should throw when game.version is undefined", () => {
        const mockGame = createMockGame();
        // Explizit version auf undefined setzen
        Object.defineProperty(mockGame, "version", {
          value: undefined,
          writable: true,
          configurable: true,
        });

        const cleanup = withFoundryGlobals({
          game: mockGame,
        });

        expect(() => getFoundryVersion()).toThrow("Foundry version is not available");

        cleanup();
      });

      it("should throw when game.version is empty string", () => {
        const mockGame = createMockGame({ version: "" });
        const cleanup = withFoundryGlobals({
          game: mockGame,
        });

        // Empty string wird als falsy behandelt und sollte "not available" Error werfen
        expect(() => getFoundryVersion()).toThrow("Foundry version is not available");

        cleanup();
      });

      it("should throw when game.version contains non-numeric characters", () => {
        const cleanup = withFoundryGlobals({
          game: createMockGame({ version: "abc" }),
        });

        expect(() => getFoundryVersion()).toThrow("Could not parse Foundry version");

        cleanup();
      });

      it("should throw when game.version is null", () => {
        const mockGame = createMockGame();
        Object.defineProperty(mockGame, "version", {
          value: null,
          writable: true,
          configurable: true,
        });

        const cleanup = withFoundryGlobals({
          game: mockGame,
        });

        expect(() => getFoundryVersion()).toThrow("Foundry version is not available");

        cleanup();
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

      it("should return undefined on error", () => {
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
    });
  });
});

