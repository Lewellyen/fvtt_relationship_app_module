/* eslint-disable @typescript-eslint/no-explicit-any */
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
    vi.doMock("@/config/dependencyconfig", () => ({
      configureDependencies: vi.fn().mockReturnValue({
        ok: false,
        error: "Bootstrap failed: PORT_SELECTION_FAILED - Compatibility issue",
      }),
    }));

    vi.resetModules();

    const versioningModule = await vi.importActual<
      typeof import("@/foundry/versioning/versiondetector")
    >("@/foundry/versioning/versiondetector");
    versioningModule.resetVersionCache();

    const mockUI = createMockUI();
    const cleanup = withFoundryGlobals({
      game: { version: "12.331" } as any,
      Hooks: createMockHooks(),
      ui: mockUI,
    });

    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await import("@/core/init-solid");

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
});
