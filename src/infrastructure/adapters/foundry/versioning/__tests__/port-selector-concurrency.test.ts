/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { PortSelector } from "@/infrastructure/adapters/foundry/versioning/portselector";
import {
  getFoundryVersionResult,
  resetVersionCache,
} from "@/infrastructure/adapters/foundry/versioning/versiondetector";
import { expectResultOk } from "@/test/utils/test-helpers";
import { ok } from "@/infrastructure/shared/utils/result";
import { PortSelectionEventEmitter } from "@/infrastructure/adapters/foundry/versioning/port-selection-events";
import type { ObservabilityRegistry } from "@/infrastructure/observability/observability-registry";
import type { ServiceContainer } from "@/infrastructure/di/container";
import type { InjectionToken } from "@/infrastructure/di/types/core/injectiontoken";
import type { ServiceType } from "@/infrastructure/shared/tokens";
import { createInjectionToken } from "@/infrastructure/di/tokenutilities";

vi.mock("@/infrastructure/adapters/foundry/versioning/versiondetector", () => ({
  getFoundryVersionResult: vi.fn(),
  resetVersionCache: vi.fn(),
}));

describe("Concurrency: Port Selection", () => {
  let selector: PortSelector;
  let mockEventEmitter: PortSelectionEventEmitter;
  let mockObservability: ObservabilityRegistry;
  let mockContainer: ServiceContainer;
  const token13 = createInjectionToken<ServiceType>("port-v13") as any;
  const token14 = createInjectionToken<ServiceType>("port-v14") as any;

  beforeEach(() => {
    mockEventEmitter = new PortSelectionEventEmitter();
    mockObservability = {
      registerPortSelector: vi.fn(),
    } as any;

    mockContainer = {
      resolveWithError: vi.fn((token: InjectionToken<any>) => {
        if (token === token13) return { ok: true, value: "port-v13" };
        if (token === token14) return { ok: true, value: "port-v14" };
        return { ok: false, error: { message: "Token not found" } };
      }),
    } as any;

    selector = new PortSelector(mockEventEmitter, mockObservability, mockContainer);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    resetVersionCache();
  });

  it.concurrent("should return same port for concurrent requests", async () => {
    const tokens = new Map([
      [13, token13],
      [14, token14],
    ]) as any;

    vi.mocked(getFoundryVersionResult).mockReturnValue(ok(13));

    // 10 parallele Requests
    const promises = Array.from({ length: 10 }, () => selector.selectPortFromTokens(tokens));

    const results = await Promise.all(promises);

    // Alle sollten erfolgreich sein
    results.forEach((result) => {
      expectResultOk(result);
    });

    // Alle sollten denselben Port zurückgeben
    const firstResult = results[0];
    if (!firstResult || !firstResult.ok) {
      throw new Error("First result should be ok");
    }
    const firstPort = firstResult.value;
    expect(results.every((r) => r.ok && r.value === firstPort)).toBe(true);
  });

  it.concurrent("should handle 100 concurrent requests", async () => {
    const tokens = new Map([
      [13, token13],
      [14, token14],
    ]) as any;

    vi.mocked(getFoundryVersionResult).mockReturnValue(ok(13));

    // 100 parallele Requests
    const promises = Array.from({ length: 100 }, () => selector.selectPortFromTokens(tokens));

    const results = await Promise.all(promises);

    // Alle erfolgreich
    expect(results.every((r) => r.ok)).toBe(true);

    // Alle gleich
    const firstResult = results[0];
    if (!firstResult || !firstResult.ok) {
      throw new Error("First result should be ok");
    }
    const firstPort = firstResult.value;
    expect(results.every((r) => r.ok && r.value === firstPort)).toBe(true);
  });
});
