/* eslint-disable @typescript-eslint/no-explicit-any */
// Test file: `any` needed for testing port instantiation crashes

import { describe, it, expect, vi, beforeEach } from "vitest";
import { PortSelector } from "@/infrastructure/adapters/foundry/versioning/portselector";
import { expectResultOk, expectResultErr } from "@/test/utils/test-helpers";

import { ok, err } from "@/domain/utils/result";
import { PortSelectionEventEmitter } from "@/infrastructure/adapters/foundry/versioning/port-selection-events";
import type { ObservabilityRegistry } from "@/infrastructure/observability/observability-registry";
import type { InjectionToken } from "@/infrastructure/di/types/core/injectiontoken";
import type { ServiceType } from "@/infrastructure/shared/tokens";
import { createInjectionToken } from "@/infrastructure/di/tokenutilities";

vi.mock("@/infrastructure/adapters/foundry/versioning/versiondetector", () => ({
  getFoundryVersionResult: vi.fn(),
  resetVersionCache: vi.fn(),
  tryGetFoundryVersion: vi.fn(),
}));

describe("PortSelector - Lazy Instantiation", () => {
  let mockObservability: ObservabilityRegistry;

  beforeEach(() => {
    mockObservability = {
      registerPortSelector: vi.fn(),
    } as any;
  });

  it("should NOT resolve v14 token when running on v13", () => {
    const v13Port = { version: 13 };
    const v14Port = { version: 14 };

    const token13 = createInjectionToken<ServiceType>("port-v13") as any;
    const token14 = createInjectionToken<ServiceType>("port-v14") as any;

    const resolveV13 = vi.fn(() => ({ ok: true, value: v13Port }));
    const resolveV14 = vi.fn(() => {
      // Simulate v14 API access that would crash on v13
      if (typeof (globalThis as any).foundryV14Api === "undefined") {
        throw new Error("v14 API not available");
      }
      return { ok: true, value: v14Port };
    });

    const tokens = new Map([
      [13, token13],
      [14, token14],
    ]) as any;

    const mockContainer = {
      resolveWithError: vi.fn((token: InjectionToken<any>) => {
        if (token === token13) return resolveV13();
        if (token === token14) return resolveV14();
        return { ok: false, error: { message: "Token not found" } };
      }),
    } as any;

    const mockEventEmitter = new PortSelectionEventEmitter();
    const selector = new PortSelector(mockEventEmitter, mockObservability, mockContainer);
    const result = selector.selectPortFromTokens(tokens, 13);

    expectResultOk(result);
    expect(result.value).toEqual({ version: 13 });

    // CRITICAL: v14 token must NOT have been resolved
    expect(resolveV13).toHaveBeenCalledOnce();
    expect(resolveV14).not.toHaveBeenCalled();
  });

  it("should handle container resolution errors gracefully", () => {
    const token14 = createInjectionToken<ServiceType>("port-v14") as any;

    const mockContainer = {
      resolveWithError: vi.fn(() => {
        throw new Error("Port requires v14 API");
      }),
    } as any;

    const tokens = new Map([[14, token14]]) as any;
    const mockEventEmitter = new PortSelectionEventEmitter();
    const selector = new PortSelector(mockEventEmitter, mockObservability, mockContainer);

    const result = selector.selectPortFromTokens(tokens, 14);

    expectResultErr(result);
    expect(result.error.code).toBe("PORT_SELECTION_FAILED");
    expect(result.error.message).toContain("Failed to resolve port v14 from container");
  });

  it("should select highest compatible version", () => {
    const token12 = createInjectionToken<ServiceType>("port-v12") as any;
    const token13 = createInjectionToken<ServiceType>("port-v13") as any;
    const token14 = createInjectionToken<ServiceType>("port-v14") as any;

    const resolveV13 = vi.fn(() => ({ ok: true, value: { version: 13 } }));

    const mockContainer = {
      resolveWithError: vi.fn((token: InjectionToken<any>) => {
        if (token === token13) return resolveV13();
        if (token === token12) return { ok: true, value: { version: 12 } };
        if (token === token14) return { ok: true, value: { version: 14 } };
        return { ok: false, error: { message: "Token not found" } };
      }),
    } as any;

    const tokens = new Map([
      [12, token12],
      [13, token13],
      [14, token14],
    ]) as any;

    const mockEventEmitter = new PortSelectionEventEmitter();
    const selector = new PortSelector(mockEventEmitter, mockObservability, mockContainer);
    const result = selector.selectPortFromTokens(tokens, 13);

    expectResultOk(result);
    expect((result.value as any).version).toBe(13);
    expect(resolveV13).toHaveBeenCalled();
  });

  it("should return error when no compatible port available", () => {
    const token14 = createInjectionToken<ServiceType>("port-v14") as any;
    const token15 = createInjectionToken<ServiceType>("port-v15") as any;

    const resolveV14 = vi.fn(() => ({ ok: true, value: { version: 14 } }));
    const resolveV15 = vi.fn(() => ({ ok: true, value: { version: 15 } }));

    const mockContainer = {
      resolveWithError: vi.fn((token: InjectionToken<any>) => {
        if (token === token14) return resolveV14();
        if (token === token15) return resolveV15();
        return { ok: false, error: { message: "Token not found" } };
      }),
    } as any;

    const tokens = new Map([
      [14, token14],
      [15, token15],
    ]) as any;

    const mockEventEmitter = new PortSelectionEventEmitter();
    const selector = new PortSelector(mockEventEmitter, mockObservability, mockContainer);
    const result = selector.selectPortFromTokens(tokens, 13);

    expectResultErr(result);
    expect(result.error.code).toBe("PORT_SELECTION_FAILED");
    expect(result.error.message).toContain("No compatible port found");
    expect(result.error.details).toMatchObject({ version: 13 });
    expect(resolveV14).not.toHaveBeenCalled();
    expect(resolveV15).not.toHaveBeenCalled();
  });

  it("should use getFoundryVersion when version not provided", async () => {
    const { getFoundryVersionResult } =
      await import("@/infrastructure/adapters/foundry/versioning/versiondetector");
    vi.mocked(getFoundryVersionResult).mockReturnValue(ok(13));

    const token13 = createInjectionToken<ServiceType>("port-v13") as any;
    const tokens = new Map([[13, token13]]) as any;

    const mockContainer = {
      resolveWithError: vi.fn(() => ({ ok: true, value: { version: 13 } })),
    } as any;

    const mockEventEmitter = new PortSelectionEventEmitter();
    const selector = new PortSelector(mockEventEmitter, mockObservability, mockContainer);
    const result = selector.selectPortFromTokens(tokens);

    expectResultOk(result);
    expect((result.value as any).version).toBe(13);
    expect(getFoundryVersionResult).toHaveBeenCalled();
  });

  it("should handle version detection errors", async () => {
    const { getFoundryVersionResult } =
      await import("@/infrastructure/adapters/foundry/versioning/versiondetector");
    vi.mocked(getFoundryVersionResult).mockReturnValue(err("Version detection failed"));

    const token13 = createInjectionToken<ServiceType>("port-v13") as any;
    const tokens = new Map([[13, token13]]) as any;

    const mockContainer = {
      resolveWithError: vi.fn(() => ({ ok: true, value: { version: 13 } })),
    } as any;

    const mockEventEmitter = new PortSelectionEventEmitter();
    const selector = new PortSelector(mockEventEmitter, mockObservability, mockContainer);
    const result = selector.selectPortFromTokens(tokens);

    expectResultErr(result);
    expect(result.error.code).toBe("PORT_SELECTION_FAILED");
    expect(result.error.message).toContain("Could not determine Foundry version");
  });
});
