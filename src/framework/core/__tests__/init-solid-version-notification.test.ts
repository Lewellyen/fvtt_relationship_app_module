import { describe, it, expect, afterEach, vi } from "vitest";
import { withFoundryGlobals } from "@/test/utils/test-helpers";
import { createMockHooks, createMockUI } from "@/test/mocks/foundry";

describe("init-solid Bootstrap (version notifications)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it("should omit generic bootstrap notification when Foundry is below v13", async () => {
    vi.doMock("@/framework/config/dependencyconfig", () => ({
      configureDependencies: vi.fn().mockReturnValue({
        ok: false,
        error: "Bootstrap failed: PORT_SELECTION_FAILED - Compatibility issue",
      }),
    }));

    vi.resetModules();

    const versioningModule = await vi.importActual<
      typeof import("@/infrastructure/adapters/foundry/versioning/versiondetector")
    >("@/infrastructure/adapters/foundry/versioning/versiondetector");
    versioningModule.resetVersionCache();

    const mockUI = createMockUI();
    const cleanup = withFoundryGlobals({
      game: { version: "12.331" } as any,
      Hooks: createMockHooks(),
      ui: mockUI,
    });

    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await import("@/framework/core/init-solid");

    const errorCalls = (mockUI.notifications?.error as ReturnType<typeof vi.fn>).mock.calls;
    const genericCall = errorCalls.find(
      ([message]) => typeof message === "string" && message.includes("failed to initialize")
    );
    expect(genericCall).toBeUndefined();

    const versionSpecificCall = errorCalls.find(
      ([message]) =>
        typeof message === "string" &&
        message.includes("benötigt mindestens Foundry VTT Version 13")
    );
    expect(versionSpecificCall).toBeDefined();
    expect(errorCalls.length).toBe(1);

    consoleErrorSpy.mockRestore();
    versioningModule.resetVersionCache();
    cleanup();
  });

  it("should handle PORT_SELECTION_FAILED error with Foundry v13+ (generic notification only)", async () => {
    vi.doMock("@/framework/config/dependencyconfig", () => ({
      configureDependencies: vi.fn().mockReturnValue({
        ok: false,
        error: "PORT_SELECTION_FAILED - Compatibility issue",
      }),
    }));

    vi.resetModules();

    const versioningModule = await vi.importActual<
      typeof import("@/infrastructure/adapters/foundry/versioning/versiondetector")
    >("@/infrastructure/adapters/foundry/versioning/versiondetector");
    versioningModule.resetVersionCache();

    const mockUI = createMockUI();
    const cleanup = withFoundryGlobals({
      game: { version: "13.350" } as any, // Foundry v13+
      Hooks: createMockHooks(),
      ui: mockUI,
    });

    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await import("@/framework/core/init-solid");

    // When Foundry version is >= 13, version-specific notification should NOT be shown
    // but generic error notification should be shown
    const errorCalls = (mockUI.notifications?.error as ReturnType<typeof vi.fn>).mock.calls;
    const genericCall = errorCalls.find(
      ([message]) => typeof message === "string" && message.includes("failed to initialize")
    );
    expect(genericCall).toBeDefined();

    // Version-specific notification should NOT be shown for v13+
    const versionSpecificCall = errorCalls.find(
      ([message]) =>
        typeof message === "string" &&
        message.includes("benötigt mindestens Foundry VTT Version 13")
    );
    expect(versionSpecificCall).toBeUndefined();

    consoleErrorSpy.mockRestore();
    versioningModule.resetVersionCache();
    cleanup();
  });
});
