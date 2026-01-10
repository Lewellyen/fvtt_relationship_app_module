import { describe, it, expect, beforeEach } from "vitest";
import { WindowDefaultStateProviderRegistry } from "../window-default-state-provider-registry";
import { JournalOverviewStateInitializer } from "../journal-overview-state-initializer";
import { DefaultWindowStateInitializer } from "../default-window-state-initializer";

describe("WindowDefaultStateProviderRegistry", () => {
  let registry: WindowDefaultStateProviderRegistry;

  beforeEach(() => {
    registry = new WindowDefaultStateProviderRegistry();
  });

  describe("register", () => {
    it("should register a provider for a definitionId", () => {
      const provider = new JournalOverviewStateInitializer();

      registry.register("journal-overview", provider);

      expect(registry.get("journal-overview")).toBe(provider);
    });

    it("should throw error when registering duplicate definitionId", () => {
      const provider1 = new JournalOverviewStateInitializer();
      const provider2 = new DefaultWindowStateInitializer();

      registry.register("test-window", provider1);

      expect(() => {
        registry.register("test-window", provider2);
      }).toThrow(
        'Window default state provider for definitionId "test-window" already exists. Use a different definitionId or remove the existing provider first.'
      );
    });

    it("should allow registering different providers for different definitionIds", () => {
      const provider1 = new JournalOverviewStateInitializer();
      const provider2 = new DefaultWindowStateInitializer();

      registry.register("window-1", provider1);
      registry.register("window-2", provider2);

      expect(registry.get("window-1")).toBe(provider1);
      expect(registry.get("window-2")).toBe(provider2);
    });
  });

  describe("get", () => {
    it("should return undefined for non-existent definitionId", () => {
      const result = registry.get("nonexistent");
      expect(result).toBeUndefined();
    });

    it("should return registered provider", () => {
      const provider = new JournalOverviewStateInitializer();

      registry.register("journal-overview", provider);
      const result = registry.get("journal-overview");

      expect(result).toBe(provider);
    });
  });

  describe("has", () => {
    it("should return false for non-existent definitionId", () => {
      expect(registry.has("nonexistent")).toBe(false);
    });

    it("should return true for registered definitionId", () => {
      const provider = new JournalOverviewStateInitializer();

      registry.register("journal-overview", provider);

      expect(registry.has("journal-overview")).toBe(true);
    });

    it("should return false after checking unregistered definitionId", () => {
      expect(registry.has("test-window")).toBe(false);
    });
  });
});
