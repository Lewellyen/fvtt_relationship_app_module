import { describe, it, expect, vi, beforeEach } from "vitest";
import { PortLoader } from "@/infrastructure/adapters/foundry/services/PortLoader";
import type { FoundryGame } from "@/infrastructure/adapters/foundry/interfaces/FoundryGame";
import type { PortSelector } from "@/infrastructure/adapters/foundry/versioning/portselector";
import type { PortRegistry } from "@/infrastructure/adapters/foundry/versioning/portregistry";
import type { FoundryError } from "@/infrastructure/adapters/foundry/errors/FoundryErrors";
import type { InjectionToken } from "@/infrastructure/di/types/core/injectiontoken";
import { createInjectionToken } from "@/infrastructure/di/token-factory";
import { ok, err } from "@/domain/utils/result";

// Mock port for testing
class MockPort implements FoundryGame {
  getJournalEntries = vi.fn();
  getJournalEntryById = vi.fn();
  invalidateCache = vi.fn();
  dispose = vi.fn();
}

describe("PortLoader", () => {
  let mockPortSelector: PortSelector;
  let mockPortRegistry: PortRegistry<FoundryGame>;
  let portLoader: PortLoader<FoundryGame>;
  let mockPort: MockPort;

  beforeEach(() => {
    mockPort = new MockPort();

    mockPortSelector = {
      selectPortFromTokens: vi.fn(),
    } as unknown as PortSelector;

    mockPortRegistry = {
      getTokens: vi.fn(() => []),
    } as unknown as PortRegistry<FoundryGame>;

    portLoader = new PortLoader(mockPortSelector, mockPortRegistry);
  });

  describe("loadPort", () => {
    it("should lazy-load port on first call", () => {
      const token1 = createInjectionToken<FoundryGame>("token1");
      const token2 = createInjectionToken<FoundryGame>("token2");
      const tokens = new Map<number, InjectionToken<FoundryGame>>([
        [13, token1],
        [13, token2],
      ]);
      vi.mocked(mockPortRegistry.getTokens).mockReturnValue(tokens);
      vi.mocked(mockPortSelector.selectPortFromTokens).mockReturnValue(ok(mockPort));

      const result = portLoader.loadPort("FoundryGame");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(mockPort);
      }
      expect(mockPortSelector.selectPortFromTokens).toHaveBeenCalledWith(
        tokens,
        undefined,
        "FoundryGame"
      );
      expect(mockPortRegistry.getTokens).toHaveBeenCalled();
    });

    it("should cache port after first load", () => {
      const token1 = createInjectionToken<FoundryGame>("token1");
      const tokens = new Map<number, InjectionToken<FoundryGame>>([[13, token1]]);
      vi.mocked(mockPortRegistry.getTokens).mockReturnValue(tokens);
      vi.mocked(mockPortSelector.selectPortFromTokens).mockReturnValue(ok(mockPort));

      // First call
      const result1 = portLoader.loadPort("FoundryGame");
      expect(result1.ok).toBe(true);

      // Second call should not call selectPortFromTokens again
      vi.clearAllMocks();
      const result2 = portLoader.loadPort("FoundryGame");
      expect(result2.ok).toBe(true);
      if (result2.ok) {
        expect(result2.value).toBe(mockPort);
      }
      expect(mockPortSelector.selectPortFromTokens).not.toHaveBeenCalled();
    });

    it("should propagate port selection errors", () => {
      const token1 = createInjectionToken<FoundryGame>("token1");
      const tokens = new Map<number, InjectionToken<FoundryGame>>([[13, token1]]);
      const error: FoundryError = {
        code: "PORT_SELECTION_FAILED",
        message: "No compatible port found",
      };
      vi.mocked(mockPortRegistry.getTokens).mockReturnValue(tokens);
      vi.mocked(mockPortSelector.selectPortFromTokens).mockReturnValue(err(error));

      const result = portLoader.loadPort("FoundryGame");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toEqual(error);
      }
    });

    it("should return cached port on subsequent calls", () => {
      const token1 = createInjectionToken<FoundryGame>("token1");
      const tokens = new Map<number, InjectionToken<FoundryGame>>([[13, token1]]);
      vi.mocked(mockPortRegistry.getTokens).mockReturnValue(tokens);
      vi.mocked(mockPortSelector.selectPortFromTokens).mockReturnValue(ok(mockPort));

      portLoader.loadPort("FoundryGame");
      const result = portLoader.loadPort("FoundryGame");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(mockPort);
      }
      // Should only call selectPortFromTokens once
      expect(mockPortSelector.selectPortFromTokens).toHaveBeenCalledTimes(1);
    });
  });

  describe("getLoadedPort", () => {
    it("should return null if port not yet loaded", () => {
      const port = portLoader.getLoadedPort();
      expect(port).toBeNull();
    });

    it("should return loaded port after loadPort", () => {
      const token1 = createInjectionToken<FoundryGame>("token1");
      const tokens = new Map<number, InjectionToken<FoundryGame>>([[13, token1]]);
      vi.mocked(mockPortRegistry.getTokens).mockReturnValue(tokens);
      vi.mocked(mockPortSelector.selectPortFromTokens).mockReturnValue(ok(mockPort));

      portLoader.loadPort("FoundryGame");
      const port = portLoader.getLoadedPort();

      expect(port).toBe(mockPort);
    });
  });

  describe("clearCache", () => {
    it("should clear cached port", () => {
      const token1 = createInjectionToken<FoundryGame>("token1");
      const tokens = new Map<number, InjectionToken<FoundryGame>>([[13, token1]]);
      vi.mocked(mockPortRegistry.getTokens).mockReturnValue(tokens);
      vi.mocked(mockPortSelector.selectPortFromTokens).mockReturnValue(ok(mockPort));

      portLoader.loadPort("FoundryGame");
      expect(portLoader.getLoadedPort()).toBe(mockPort);

      portLoader.clearCache();
      expect(portLoader.getLoadedPort()).toBeNull();

      // Should reload on next call
      vi.mocked(mockPortSelector.selectPortFromTokens).mockReturnValue(ok(mockPort));
      const result = portLoader.loadPort("FoundryGame");
      expect(result.ok).toBe(true);
      expect(mockPortSelector.selectPortFromTokens).toHaveBeenCalledTimes(2);
    });
  });
});
