import { describe, it, expect, beforeEach } from "vitest";
import { ApiWrapperStrategyRegistry } from "../api-wrapper-strategy-registry";
import type { ApiWrapperStrategy } from "../api-wrapper-strategy.interface";
import type { ApiSafeToken } from "@/infrastructure/di/types/utilities/api-safe-token";
import type { ModuleApiTokens } from "@/framework/core/api/module-api";

describe("ApiWrapperStrategyRegistry", () => {
  let registry: ApiWrapperStrategyRegistry;

  beforeEach(() => {
    registry = new ApiWrapperStrategyRegistry();
  });

  describe("register", () => {
    it("should register a strategy", () => {
      const strategy: ApiWrapperStrategy = {
        supports: () => true,
        wrap: (service) => service,
      };

      registry.register(strategy);

      const strategies = registry.getAll();
      expect(strategies).toHaveLength(1);
      expect(strategies[0]).toBe(strategy);
    });

    it("should register multiple strategies", () => {
      const strategy1: ApiWrapperStrategy = {
        supports: () => true,
        wrap: (service) => service,
        getPriority: () => 10,
      };
      const strategy2: ApiWrapperStrategy = {
        supports: () => true,
        wrap: (service) => service,
        getPriority: () => 20,
      };

      registry.registerAll([strategy1, strategy2]);

      const strategies = registry.getAll();
      expect(strategies).toHaveLength(2);
    });
  });

  describe("getAll", () => {
    it("should return strategies sorted by priority", () => {
      const strategy1: ApiWrapperStrategy = {
        supports: () => true,
        wrap: (service) => service,
        getPriority: () => 30,
      };
      const strategy2: ApiWrapperStrategy = {
        supports: () => true,
        wrap: (service) => service,
        getPriority: () => 10,
      };
      const strategy3: ApiWrapperStrategy = {
        supports: () => true,
        wrap: (service) => service,
        getPriority: () => 20,
      };

      registry.registerAll([strategy1, strategy2, strategy3]);

      const strategies = registry.getAll();
      expect(strategies).toHaveLength(3);
      expect(strategies[0]).toBe(strategy2); // Priority 10
      expect(strategies[1]).toBe(strategy3); // Priority 20
      expect(strategies[2]).toBe(strategy1); // Priority 30
    });

    it("should use default priority 100 when not specified", () => {
      const strategy1: ApiWrapperStrategy = {
        supports: () => true,
        wrap: (service) => service,
        getPriority: () => 10,
      };
      const strategy2: ApiWrapperStrategy = {
        supports: () => true,
        wrap: (service) => service,
        // No getPriority - should default to 100
      };

      registry.registerAll([strategy2, strategy1]);

      const strategies = registry.getAll();
      expect(strategies[0]).toBe(strategy1); // Priority 10
      expect(strategies[1]).toBe(strategy2); // Priority 100 (default)
    });
  });

  describe("findStrategy", () => {
    it("should find first matching strategy by priority", () => {
      const mockToken = Symbol("TestToken") as ApiSafeToken<unknown>;
      const mockTokens = {} as ModuleApiTokens;

      const strategy1: ApiWrapperStrategy = {
        supports: () => false,
        wrap: (service) => service,
        getPriority: () => 10,
      };
      const strategy2: ApiWrapperStrategy = {
        supports: (token) => token === mockToken,
        wrap: (service) => service,
        getPriority: () => 20,
      };
      const strategy3: ApiWrapperStrategy = {
        supports: (token) => token === mockToken,
        wrap: (service) => service,
        getPriority: () => 5, // Higher priority than strategy2
      };

      registry.registerAll([strategy1, strategy2, strategy3]);

      const found = registry.findStrategy(mockToken, mockTokens);
      expect(found).toBe(strategy3); // Should find the one with highest priority (lowest number)
    });

    it("should return null when no strategy matches", () => {
      const mockToken = Symbol("TestToken") as ApiSafeToken<unknown>;
      const mockTokens = {} as ModuleApiTokens;

      const strategy: ApiWrapperStrategy = {
        supports: () => false,
        wrap: (service) => service,
      };

      registry.register(strategy);

      const found = registry.findStrategy(mockToken, mockTokens);
      expect(found).toBeNull();
    });
  });

  describe("clear", () => {
    it("should clear all registered strategies", () => {
      const strategy1: ApiWrapperStrategy = {
        supports: () => true,
        wrap: (service) => service,
      };
      const strategy2: ApiWrapperStrategy = {
        supports: () => true,
        wrap: (service) => service,
      };

      registry.registerAll([strategy1, strategy2]);
      expect(registry.getAll()).toHaveLength(2);

      registry.clear();
      expect(registry.getAll()).toHaveLength(0);
    });
  });
});
