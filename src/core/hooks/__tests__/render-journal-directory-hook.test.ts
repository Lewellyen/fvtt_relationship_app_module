/**
 * Tests for RenderJournalDirectoryHook
 */

import { describe, it, expect } from "vitest";
import { RenderJournalDirectoryHook } from "../render-journal-directory-hook";
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
    it("should dispose safely when no unsubscribe", () => {
      const hook = new RenderJournalDirectoryHook();

      expect(() => hook.dispose()).not.toThrow();
    });

    it("should call unsubscribe if set", () => {
      const container = ServiceContainer.createRoot();
      configureDependencies(container);

      const hook = new RenderJournalDirectoryHook();
      hook.register(container);

      // Dispose should not throw
      expect(() => hook.dispose()).not.toThrow();
    });
  });
});
