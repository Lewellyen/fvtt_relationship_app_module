import { describe, it, expect } from "vitest";
import { PortRegistry } from "@/infrastructure/adapters/foundry/versioning/portregistry";
import { expectResultOk, expectResultErr } from "@/test/utils/test-helpers";
import type { ServiceType } from "@/infrastructure/shared/tokens";
import { createInjectionToken } from "@/infrastructure/di/tokenutilities";

describe("PortRegistry", () => {
  describe("register", () => {
    it("should register port token", () => {
      const registry = new PortRegistry<ServiceType>();
      const token = createInjectionToken<ServiceType>("port-instance");

      const result = registry.register(13, token);
      expectResultOk(result);
    });

    it("should reject duplicate version registration", () => {
      const registry = new PortRegistry<ServiceType>();
      const token1 = createInjectionToken<ServiceType>("port-1");
      const token2 = createInjectionToken<ServiceType>("port-2");

      registry.register(13, token1);
      const result = registry.register(13, token2);

      expectResultErr(result);
      expect(result.error.message).toContain("already registered");
      expect(result.error.code).toBe("PORT_REGISTRY_ERROR");
    });
  });

  describe("getAvailableVersions", () => {
    it("should return sorted versions", () => {
      const registry = new PortRegistry<ServiceType>();

      registry.register(15, createInjectionToken<ServiceType>("port-15"));
      registry.register(13, createInjectionToken<ServiceType>("port-13"));
      registry.register(14, createInjectionToken<ServiceType>("port-14"));

      const versions = registry.getAvailableVersions();
      expect(versions).toEqual([13, 14, 15]);
    });

    it("should return empty array when no ports registered", () => {
      const registry = new PortRegistry<ServiceType>();
      const versions = registry.getAvailableVersions();
      expect(versions).toEqual([]);
    });
  });

  describe("getTokens", () => {
    it("should return all registered injection tokens", () => {
      const registry = new PortRegistry<ServiceType>();

      const token13 = createInjectionToken<ServiceType>("port-13");
      const token14 = createInjectionToken<ServiceType>("port-14");

      registry.register(13, token13);
      registry.register(14, token14);

      const tokens = registry.getTokens();
      expect(tokens.size).toBe(2);

      // Verify tokens are stored correctly
      expect(tokens.get(13)).toBe(token13);
      expect(tokens.get(14)).toBe(token14);
    });

    it("should return a copy of the token map", () => {
      const registry = new PortRegistry<ServiceType>();
      const token13 = createInjectionToken<ServiceType>("port-13");

      registry.register(13, token13);

      const tokens1 = registry.getTokens();
      const tokens2 = registry.getTokens();

      // Should be different Map instances
      expect(tokens1).not.toBe(tokens2);
      // But should contain the same tokens
      expect(tokens1.get(13)).toBe(tokens2.get(13));
    });
  });

  describe("hasVersion", () => {
    it("should return true for registered version", () => {
      const registry = new PortRegistry<ServiceType>();
      registry.register(13, createInjectionToken<ServiceType>("port-13"));

      expect(registry.hasVersion(13)).toBe(true);
    });

    it("should return false for unregistered version", () => {
      const registry = new PortRegistry<ServiceType>();
      registry.register(13, createInjectionToken<ServiceType>("port-13"));

      expect(registry.hasVersion(14)).toBe(false);
    });
  });

  describe("getHighestVersion", () => {
    it("should return highest registered version", () => {
      const registry = new PortRegistry<ServiceType>();

      registry.register(13, createInjectionToken<ServiceType>("port-13"));
      registry.register(15, createInjectionToken<ServiceType>("port-15"));
      registry.register(14, createInjectionToken<ServiceType>("port-14"));

      expect(registry.getHighestVersion()).toBe(15);
    });

    it("should return undefined when no ports registered", () => {
      const registry = new PortRegistry<ServiceType>();
      expect(registry.getHighestVersion()).toBeUndefined();
    });
  });
});
