// Test file: `any` needed for mocking Foundry global objects (game, Hooks, ui)
// Isolated tests for edge cases in init-solid.ts that are difficult to test in the main test file

import { describe, it, expect, afterEach, vi } from "vitest";
import { withFoundryGlobals } from "@/test/utils/test-helpers";
import { createMockHooks, createMockGame, createMockUI } from "@/test/mocks/foundry";

describe("init-solid Bootstrap (UI edge cases)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules(); // KRITISCH: Modul neu laden
    vi.restoreAllMocks();
  });

  describe("UI notifications edge cases", () => {
    it("should handle ui defined but ui.notifications undefined for old Foundry version", async () => {
      vi.resetModules();

      const versioningModule = await vi.importActual<
        typeof import("@/infrastructure/adapters/foundry/versioning/versiondetector")
      >("@/infrastructure/adapters/foundry/versioning/versiondetector");
      versioningModule.resetVersionCache();

      // Create ui object without notifications property
      const mockUI = {
        // notifications is undefined
      } as typeof ui;

      const cleanup = withFoundryGlobals({
        game: { version: "12.331" } as any,
        Hooks: createMockHooks(),
        ui: mockUI,
      });

      // Mock configureDependencies to fail with PORT_SELECTION_FAILED
      vi.doMock("@/framework/config/dependencyconfig", () => ({
        configureDependencies: vi.fn().mockReturnValue({
          ok: false,
          error: "Bootstrap failed: PORT_SELECTION_FAILED - No compatible port found",
        }),
      }));

      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      // Should not crash even if ui.notifications is undefined
      await expect(import("@/framework/core/init-solid")).resolves.toBeDefined();

      // Should log error to console
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
      versioningModule.resetVersionCache();
      cleanup();
    });

    it("should handle ui defined but ui.notifications undefined for generic error", async () => {
      vi.resetModules();

      // Create ui object without notifications property
      const mockUI = {
        // notifications is undefined
      } as typeof ui;

      const cleanup = withFoundryGlobals({
        game: createMockGame(),
        Hooks: createMockHooks(),
        ui: mockUI,
      });

      // Mock configureDependencies to fail
      vi.doMock("@/framework/config/dependencyconfig", () => ({
        configureDependencies: vi.fn().mockReturnValue({
          ok: false,
          error: "Test bootstrap error",
        }),
      }));

      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      // Should not crash even if ui.notifications is undefined
      await expect(import("@/framework/core/init-solid")).resolves.toBeDefined();

      // Should log error to console
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
      cleanup();
    });

    it("should handle ui defined but ui.notifications null for old Foundry version", async () => {
      vi.resetModules();

      const versioningModule = await vi.importActual<
        typeof import("@/infrastructure/adapters/foundry/versioning/versiondetector")
      >("@/infrastructure/adapters/foundry/versioning/versiondetector");
      versioningModule.resetVersionCache();

      // Create ui object with notifications set to null
      const mockUI = {
        notifications: null,
      } as unknown as typeof ui;

      const cleanup = withFoundryGlobals({
        game: { version: "12.331" } as any,
        Hooks: createMockHooks(),
        ui: mockUI,
      });

      // Mock configureDependencies to fail with PORT_SELECTION_FAILED
      vi.doMock("@/framework/config/dependencyconfig", () => ({
        configureDependencies: vi.fn().mockReturnValue({
          ok: false,
          error: "Bootstrap failed: PORT_SELECTION_FAILED - No compatible port found",
        }),
      }));

      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      // Should not crash even if ui.notifications is null
      await expect(import("@/framework/core/init-solid")).resolves.toBeDefined();

      // Should log error to console
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
      versioningModule.resetVersionCache();
      cleanup();
    });

    it("should handle PORT_SELECTION_FAILED when foundryVersion is undefined", async () => {
      vi.resetModules();

      const versioningModule = await vi.importActual<
        typeof import("@/infrastructure/adapters/foundry/versioning/versiondetector")
      >("@/infrastructure/adapters/foundry/versioning/versiondetector");
      versioningModule.resetVersionCache();

      const mockUI = createMockUI();
      const cleanup = withFoundryGlobals({
        game: {}, // No version property - foundryVersion will be undefined
        Hooks: createMockHooks(),
        ui: mockUI,
      });

      // Mock configureDependencies to fail with PORT_SELECTION_FAILED
      vi.doMock("@/framework/config/dependencyconfig", () => ({
        configureDependencies: vi.fn().mockReturnValue({
          ok: false,
          error: "Bootstrap failed: PORT_SELECTION_FAILED - No compatible port found",
        }),
      }));

      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      await import("@/framework/core/init-solid");

      // Should show generic error (not version-specific, since foundryVersion is undefined)
      expect(mockUI.notifications?.error).toHaveBeenCalledWith(
        expect.stringContaining("failed to initialize"),
        { permanent: true }
      );

      // Should NOT show version-specific message (since foundryVersion is undefined)
      const errorCalls = (mockUI.notifications?.error as any).mock.calls;
      const versionSpecificCall = errorCalls.find((call: any) =>
        call[0].includes("benötigt mindestens")
      );
      expect(versionSpecificCall).toBeUndefined();

      consoleErrorSpy.mockRestore();
      versioningModule.resetVersionCache();
      cleanup();
    });
  });
});
