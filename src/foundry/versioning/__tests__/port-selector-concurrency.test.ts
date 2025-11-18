/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { PortSelector } from "../portselector";
import { getFoundryVersionResult, resetVersionCache } from "../versiondetector";
import { expectResultOk } from "@/test/utils/test-helpers";
import { ok } from "@/utils/functional/result";
import { PortSelectionEventEmitter } from "../port-selection-events";
import type { ObservabilityRegistry } from "@/observability/observability-registry";

vi.mock("../versiondetector", () => ({
  getFoundryVersionResult: vi.fn(),
  resetVersionCache: vi.fn(),
}));

describe("Concurrency: Port Selection", () => {
  let selector: PortSelector;
  let mockEventEmitter: PortSelectionEventEmitter;
  let mockObservability: ObservabilityRegistry;

  beforeEach(() => {
    mockEventEmitter = new PortSelectionEventEmitter();
    mockObservability = {
      registerPortSelector: vi.fn(),
    } as any;

    selector = new PortSelector(mockEventEmitter, mockObservability);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    resetVersionCache();
  });

  it.concurrent("should return same port for concurrent requests", async () => {
    const factories = new Map([
      [13, () => "port-v13"],
      [14, () => "port-v14"],
    ]);

    vi.mocked(getFoundryVersionResult).mockReturnValue(ok(13));

    // 10 parallele Requests
    const promises = Array.from({ length: 10 }, () => selector.selectPortFromFactories(factories));

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
    const factories = new Map([
      [13, () => "port-v13"],
      [14, () => "port-v14"],
    ]);

    vi.mocked(getFoundryVersionResult).mockReturnValue(ok(13));

    // 100 parallele Requests
    const promises = Array.from({ length: 100 }, () => selector.selectPortFromFactories(factories));

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
