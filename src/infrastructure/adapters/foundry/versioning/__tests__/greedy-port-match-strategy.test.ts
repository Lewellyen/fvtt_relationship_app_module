import { describe, it, expect, beforeEach } from "vitest";
import { GreedyPortMatchStrategy } from "../greedy-port-match-strategy";
import { expectResultOk, expectResultErr } from "@/test/utils/test-helpers";
import { createInjectionToken } from "@/infrastructure/di/token-factory";
import type { InjectionToken } from "@/infrastructure/di/types/core/injectiontoken";

describe("GreedyPortMatchStrategy", () => {
  let strategy: GreedyPortMatchStrategy<unknown>;

  // Create test tokens
  const token12 = createInjectionToken<unknown>("port-v12") as any;
  const token13 = createInjectionToken<unknown>("port-v13") as any;
  const token14 = createInjectionToken<unknown>("port-v14") as any;
  const token15 = createInjectionToken<unknown>("port-v15") as any;
  const token16 = createInjectionToken<unknown>("port-v16") as any;

  beforeEach(() => {
    strategy = new GreedyPortMatchStrategy();
  });

  describe("select", () => {
    it("should select highest compatible port version", () => {
      const tokens = new Map([
        [13, token13],
        [14, token14],
        [15, token15],
      ]) as Map<number, InjectionToken<unknown>>;

      const result = strategy.select(tokens, 14);
      expectResultOk(result);
      expect(result.value.version).toBe(14);
      expect(result.value.token).toBe(token14);
    });

    it("should fallback to lower version when exact match not available", () => {
      const tokens = new Map([
        [13, token13],
        [15, token15],
      ]) as Map<number, InjectionToken<unknown>>;

      const result = strategy.select(tokens, 14);
      expectResultOk(result);
      expect(result.value.version).toBe(13);
      expect(result.value.token).toBe(token13);
    });

    it("should ignore ports with version higher than Foundry version", () => {
      const tokens = new Map([
        [13, token13],
        [15, token15],
      ]) as Map<number, InjectionToken<unknown>>;

      const result = strategy.select(tokens, 13);
      expectResultOk(result);
      expect(result.value.version).toBe(13);
      expect(result.value.token).toBe(token13);
    });

    it("should fail when no compatible port available", () => {
      const tokens = new Map([
        [14, token14],
        [15, token15],
      ]) as Map<number, InjectionToken<unknown>>;

      const result = strategy.select(tokens, 13);
      expectResultErr(result);
      expect(result.error.code).toBe("PORT_SELECTION_FAILED");
      expect(result.error.message).toContain("No compatible port found");
      expect((result.error.details as { version: number }).version).toBe(13);
    });

    it("should select exact version match when available", () => {
      const token12 = createInjectionToken<unknown>("port-v12") as any;
      const tokens = new Map([
        [12, token12],
        [13, token13],
        [14, token14],
      ]) as Map<number, InjectionToken<unknown>>;

      const result = strategy.select(tokens, 13);
      expectResultOk(result);
      expect(result.value.version).toBe(13);
      expect(result.value.token).toBe(token13);
    });

    it("should prefer higher version when multiple compatible ports available", () => {
      const tokens = new Map([
        [12, token12],
        [13, token13],
        [14, token14],
      ]) as Map<number, InjectionToken<unknown>>;

      const result = strategy.select(tokens, 15);
      expectResultOk(result);
      expect(result.value.version).toBe(14);
      expect(result.value.token).toBe(token14);
    });

    it("should handle empty token map", () => {
      const tokens = new Map<number, InjectionToken<unknown>>();

      const result = strategy.select(tokens, 13);
      expectResultErr(result);
      expect(result.error.code).toBe("PORT_SELECTION_FAILED");
      expect(result.error.message).toContain("No compatible port found");
    });

    it("should handle future Foundry versions by falling back to latest available port", () => {
      const tokens = new Map([
        [13, token13],
        [14, token14],
      ]) as Map<number, InjectionToken<unknown>>;

      // Foundry v15 with only v13 and v14 ports available
      const result = strategy.select(tokens, 15);
      expectResultOk(result);
      // Should select highest available port (v14)
      expect(result.value.version).toBe(14);
      expect(result.value.token).toBe(token14);
    });

    it("should handle v20+ with graceful fallback", () => {
      const tokens = new Map([[13, token13]]) as Map<number, InjectionToken<unknown>>;

      // Far future version
      const result = strategy.select(tokens, 20);
      expectResultOk(result);
      // Should still select v13 as highest compatible
      expect(result.value.version).toBe(13);
      expect(result.value.token).toBe(token13);
    });

    it("should fail gracefully when no compatible port exists (all ports too new)", () => {
      const tokens = new Map([
        [14, token14],
        [15, token15],
      ]) as Map<number, InjectionToken<unknown>>;

      // Foundry v13 with only v14+ ports available
      const result = strategy.select(tokens, 13);
      expectResultErr(result);
      expect(result.error.code).toBe("PORT_SELECTION_FAILED");
      expect(result.error.message).toContain("No compatible port found");
      expect((result.error.details as { version: number; availableVersions: string }).version).toBe(
        13
      );
      expect(
        (result.error.details as { version: number; availableVersions: string }).availableVersions
      ).toBe("14, 15");
    });

    it("should sort availableVersions in error message", () => {
      const tokens = new Map([
        [15, token15],
        [13, token13],
        [14, token14],
        [16, token16],
      ]) as Map<number, InjectionToken<unknown>>;

      const result = strategy.select(tokens, 12);
      expectResultErr(result);
      const details = result.error.details as { availableVersions: string };
      // Should be sorted: "13, 14, 15, 16"
      expect(details.availableVersions).toBe("13, 14, 15, 16");
    });

    it("should handle single compatible port", () => {
      const tokens = new Map([[13, token13]]) as Map<number, InjectionToken<unknown>>;

      const result = strategy.select(tokens, 13);
      expectResultOk(result);
      expect(result.value.version).toBe(13);
      expect(result.value.token).toBe(token13);
    });

    it("should handle single incompatible port (too new)", () => {
      const tokens = new Map([[14, token14]]) as Map<number, InjectionToken<unknown>>;

      const result = strategy.select(tokens, 13);
      expectResultErr(result);
      expect(result.error.code).toBe("PORT_SELECTION_FAILED");
    });
  });
});
