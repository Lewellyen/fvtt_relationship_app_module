import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { PortSelector } from "@/infrastructure/adapters/foundry/versioning/portselector";
import {
  getFoundryVersionResult,
  resetVersionCache,
} from "@/infrastructure/adapters/foundry/versioning/versiondetector";
import { expectResultOk } from "@/test/utils/test-helpers";
import { ok } from "@/domain/utils/result";
import { PortSelectionEventEmitter } from "@/infrastructure/adapters/foundry/versioning/port-selection-events";
import type { ServiceContainer } from "@/infrastructure/di/container";
import type { InjectionToken } from "@/infrastructure/di/types/core/injectiontoken";
import { createInjectionToken } from "@/infrastructure/di/token-factory";
import type { FoundryVersionDetector } from "@/infrastructure/adapters/foundry/versioning/foundry-version-detector";
import { ok as resultOk } from "@/domain/utils/result";
import type { IPortSelectionObservability } from "@/infrastructure/adapters/foundry/versioning/port-selection-observability.interface";
import type { IPortSelectionPerformanceTracker } from "@/infrastructure/adapters/foundry/versioning/port-selection-performance-tracker.interface";
import type { PortSelectionObserver } from "@/infrastructure/adapters/foundry/versioning/port-selection-observer";
import type { PortSelectionEvent } from "@/infrastructure/adapters/foundry/versioning/port-selection-events";

vi.mock("@/infrastructure/adapters/foundry/versioning/versiondetector", () => ({
  getFoundryVersionResult: vi.fn(),
  resetVersionCache: vi.fn(),
}));

describe("Concurrency: Port Selection", () => {
  let selector: PortSelector;
  let mockEventEmitter: PortSelectionEventEmitter;
  let mockObservability: IPortSelectionObservability;
  let mockPerformanceTracker: IPortSelectionPerformanceTracker;
  let mockObserver: PortSelectionObserver;
  let mockContainer: ServiceContainer;
  const token13 = createInjectionToken<unknown>("port-v13") as any;
  const token14 = createInjectionToken<unknown>("port-v14") as any;

  beforeEach(() => {
    mockEventEmitter = new PortSelectionEventEmitter();
    mockObservability = {
      registerWithObservabilityRegistry: vi.fn(),
      setupObservability: vi.fn(),
    } as any;
    mockPerformanceTracker = {
      startTracking: vi.fn(),
      endTracking: vi.fn().mockReturnValue(0),
    } as any;
    mockObserver = {
      handleEvent: vi.fn((event: PortSelectionEvent) => {
        mockEventEmitter.emit(event);
      }),
    } as any;

    mockContainer = {
      resolveWithError: vi.fn((token: InjectionToken<any>) => {
        if (token === token13) return { ok: true, value: "port-v13" };
        if (token === token14) return { ok: true, value: "port-v14" };
        return { ok: false, error: { message: "Token not found" } };
      }),
    } as any;

    const mockVersionDetector: FoundryVersionDetector = {
      getVersion: vi.fn().mockReturnValue(resultOk(13)),
    } as any;
    selector = new PortSelector(
      mockVersionDetector,
      mockEventEmitter,
      mockObservability,
      mockPerformanceTracker,
      mockObserver,
      mockContainer
    );
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
