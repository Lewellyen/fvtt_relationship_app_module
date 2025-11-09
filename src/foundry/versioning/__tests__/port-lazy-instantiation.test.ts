/* eslint-disable @typescript-eslint/no-explicit-any */
// Test file: `any` needed for testing port instantiation crashes

import { describe, it, expect, vi } from "vitest";
import { PortSelector } from "../portselector";
import { expectResultOk, expectResultErr } from "@/test/utils/test-helpers";

import { ok, err } from "@/utils/functional/result";

vi.mock("../versiondetector", () => ({
  getFoundryVersionResult: vi.fn(),
  resetVersionCache: vi.fn(),
  tryGetFoundryVersion: vi.fn(),
}));

describe("PortSelector - Lazy Instantiation", () => {
  it("should NOT call v14 factory when running on v13", () => {
    const v13Factory = vi.fn(() => ({ version: 13 }));
    const v14Factory = vi.fn(() => {
      // Simulate v14 API access that would crash on v13
      if (typeof (globalThis as any).foundryV14Api === "undefined") {
        throw new Error("v14 API not available");
      }
      return { version: 14 };
    });

    const factories = new Map([
      [13, v13Factory],
      [14, v14Factory],
    ]);

    const selector = new PortSelector();
    const result = selector.selectPortFromFactories(factories, 13);

    expectResultOk(result);
    expect(result.value).toEqual({ version: 13 });

    // CRITICAL: v14 factory must NOT have been called
    expect(v13Factory).toHaveBeenCalledOnce();
    expect(v14Factory).not.toHaveBeenCalled();
  });

  it("should handle constructor errors gracefully", () => {
    const crashingFactory = vi.fn(() => {
      throw new Error("Port requires v14 API");
    });

    const factories = new Map([[14, crashingFactory]]);
    const selector = new PortSelector();

    const result = selector.selectPortFromFactories(factories, 14);

    expectResultErr(result);
    expect(result.error.code).toBe("PORT_SELECTION_FAILED");
    expect(result.error.message).toContain("Failed to instantiate port");
  });

  it("should select highest compatible version", () => {
    const v12Factory = vi.fn(() => ({ version: 12 }));
    const v13Factory = vi.fn(() => ({ version: 13 }));
    const v14Factory = vi.fn(() => ({ version: 14 }));

    const factories = new Map([
      [12, v12Factory],
      [13, v13Factory],
      [14, v14Factory],
    ]);

    const selector = new PortSelector();
    const result = selector.selectPortFromFactories(factories, 13);

    expectResultOk(result);
    expect(result.value.version).toBe(13);
    expect(v13Factory).toHaveBeenCalled();
    expect(v14Factory).not.toHaveBeenCalled();
  });

  it("should return error when no compatible port available", () => {
    const v14Factory = vi.fn(() => ({ version: 14 }));
    const v15Factory = vi.fn(() => ({ version: 15 }));

    const factories = new Map([
      [14, v14Factory],
      [15, v15Factory],
    ]);

    const selector = new PortSelector();
    const result = selector.selectPortFromFactories(factories, 13);

    expectResultErr(result);
    expect(result.error.code).toBe("PORT_SELECTION_FAILED");
    expect(result.error.message).toContain("No compatible port found");
    expect(result.error.details).toMatchObject({ version: 13 });
    expect(v14Factory).not.toHaveBeenCalled();
    expect(v15Factory).not.toHaveBeenCalled();
  });

  it("should use getFoundryVersion when version not provided", async () => {
    const { getFoundryVersionResult } = await import("../versiondetector");
    vi.mocked(getFoundryVersionResult).mockReturnValue(ok(13));

    const v13Factory = vi.fn(() => ({ version: 13 }));
    const factories = new Map([[13, v13Factory]]);

    const selector = new PortSelector();
    const result = selector.selectPortFromFactories(factories);

    expectResultOk(result);
    expect(result.value.version).toBe(13);
    expect(getFoundryVersionResult).toHaveBeenCalled();
  });

  it("should handle version detection errors", async () => {
    const { getFoundryVersionResult } = await import("../versiondetector");
    vi.mocked(getFoundryVersionResult).mockReturnValue(err("Version detection failed"));

    const factories = new Map([[13, () => ({ version: 13 })]]);

    const selector = new PortSelector();
    const result = selector.selectPortFromFactories(factories);

    expectResultErr(result);
    expect(result.error.code).toBe("PORT_SELECTION_FAILED");
    expect(result.error.message).toContain("Could not determine Foundry version");
  });
});
