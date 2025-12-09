// Test file: `any` needed for mocking Foundry global objects (game, Hooks, ui)

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { FoundryV13ModulePort, createFoundryV13ModulePort } from "../FoundryV13ModulePort";
import { createMockGame } from "@/test/mocks/foundry";
import { withFoundryGlobals } from "@/test/utils/test-helpers";
import { MODULE_METADATA } from "@/application/constants/app-constants";

describe("FoundryV13ModulePort", () => {
  let cleanup: (() => void) | undefined;

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    cleanup?.();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe("setModuleReady()", () => {
    it("should set module.ready to true when module exists", () => {
      const mockGame = createMockGame();
      const mockModule = {
        id: MODULE_METADATA.ID,
        ready: false,
      };
      if (mockGame.modules) {
        mockGame.modules.set(MODULE_METADATA.ID, mockModule as any);
      }

      cleanup = withFoundryGlobals({
        game: mockGame,
      });

      const port = new FoundryV13ModulePort();
      const result = port.setModuleReady(MODULE_METADATA.ID);

      expect(result).toBe(true);

      expect((mockModule as any).ready).toBe(true);
    });

    it("should return false when game is not available", () => {
      // Don't set up game global to test when it's not available
      // withFoundryGlobals({}) would create a default game mock, so we need to delete it
      cleanup = withFoundryGlobals({});
      // Explicitly remove game global to test the unavailable case

      delete (globalThis as any).game;

      const port = new FoundryV13ModulePort();
      const result = port.setModuleReady(MODULE_METADATA.ID);

      expect(result).toBe(false);
    });

    it("should return false when game.modules is not available", () => {
      const mockGame = createMockGame();

      delete (mockGame as any).modules;

      cleanup = withFoundryGlobals({
        game: mockGame,
      });

      const port = new FoundryV13ModulePort();
      const result = port.setModuleReady(MODULE_METADATA.ID);

      expect(result).toBe(false);
    });

    it("should return false when module is not found", () => {
      const mockGame = createMockGame();
      if (mockGame.modules) {
        mockGame.modules.clear();
      }

      cleanup = withFoundryGlobals({
        game: mockGame,
      });

      const port = new FoundryV13ModulePort();
      const result = port.setModuleReady(MODULE_METADATA.ID);

      expect(result).toBe(false);
    });
  });

  describe("createFoundryV13ModulePort()", () => {
    it("should create a FoundryV13ModulePort instance", () => {
      const port = createFoundryV13ModulePort();

      expect(port).toBeDefined();
      expect(typeof port.setModuleReady).toBe("function");
    });
  });
});
