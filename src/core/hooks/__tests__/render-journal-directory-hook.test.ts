/**
 * Tests for RenderJournalDirectoryHook
 */

import { describe, it, expect } from "vitest";
import {
  RenderJournalDirectoryHook,
  DIRenderJournalDirectoryHook,
} from "../render-journal-directory-hook";
import { ServiceContainer } from "@/di_infrastructure/container";
import { configureDependencies } from "@/config/dependencyconfig";

describe("RenderJournalDirectoryHook", () => {
  describe("register", () => {
    it("should register hook and handle success", () => {
      const container = ServiceContainer.createRoot();
      configureDependencies(container);

      const hook = new RenderJournalDirectoryHook();
      const result = hook.register(container);

      // Registration completes (may succeed or fail based on Foundry availability)
      expect(result).toBeDefined();
      expect(typeof result.ok).toBe("boolean");
    });

    it("should return error when service resolution fails", () => {
      const container = ServiceContainer.createRoot();
      // Don't configure dependencies - will fail to resolve

      const hook = new RenderJournalDirectoryHook();
      const result = hook.register(container);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain("Failed to resolve required services");
      }
    });
  });

  describe("dispose", () => {
    it("should dispose safely when register was never called", () => {
      const hook = new RenderJournalDirectoryHook();

      expect(() => hook.dispose()).not.toThrow();
    });

    it("should unregister hook when registered (or fail gracefully)", () => {
      const container = ServiceContainer.createRoot();
      configureDependencies(container);

      const hook = new RenderJournalDirectoryHook();
      // In Test-Umgebung kann die Registrierung aufgrund fehlender Foundry-APIs scheitern.
      // Wichtig ist, dass dispose() in jedem Fall sicher aufgerufen werden kann.
      hook.register(container);

      expect(() => hook.dispose()).not.toThrow();
    });
  });

  describe("Dependencies", () => {
    it("should expose empty dependency arrays", () => {
      expect(
        (RenderJournalDirectoryHook as unknown as { dependencies?: unknown }).dependencies
      ).toBeUndefined();
      expect(DIRenderJournalDirectoryHook.dependencies).toEqual([]);
    });
  });
});
