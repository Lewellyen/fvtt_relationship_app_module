import { describe, it, expect, beforeEach } from "vitest";
import { ServiceWrapperFactory } from "../service-wrapper-factory";
import { ApiWrapperStrategyRegistry } from "../strategies/api-wrapper-strategy-registry";
import type { ApiSafeToken } from "@/infrastructure/di/types/utilities/api-safe-token";
import type { ModuleApiTokens } from "@/framework/core/api/module-api";

describe("ServiceWrapperFactory", () => {
  let factory: ServiceWrapperFactory;
  let mockToken: ApiSafeToken<TestService>;
  let mockTokens: ModuleApiTokens;
  let testService: TestService;

  class TestService {
    constructor(public value: number) {}
  }

  beforeEach(() => {
    mockToken = Symbol("TestToken") as ApiSafeToken<TestService>;
    mockTokens = {} as ModuleApiTokens;
    testService = new TestService(42);
  });

  describe("constructor", () => {
    it("should create factory with default registry when no registry provided", () => {
      factory = new ServiceWrapperFactory();
      expect(factory).toBeDefined();
    });

    it("should use provided registry when given", () => {
      const customRegistry = new ApiWrapperStrategyRegistry();
      factory = new ServiceWrapperFactory(customRegistry);
      expect(factory).toBeDefined();
    });
  });

  describe("wrapSensitiveService", () => {
    it("should wrap service using matching strategy", () => {
      const registry = new ApiWrapperStrategyRegistry();
      const wrappedService = { value: 100 };
      const strategy = {
        supports: () => true,
        wrap: () => wrappedService as TestService,
      };
      registry.register(strategy);
      factory = new ServiceWrapperFactory(registry);

      const result = factory.wrapSensitiveService(mockToken, testService, mockTokens);

      expect(result).toBe(wrappedService);
    });

    it("should return service unchanged when no strategy matches (fallback)", () => {
      // Create factory with empty registry (no strategies)
      const emptyRegistry = new ApiWrapperStrategyRegistry();
      factory = new ServiceWrapperFactory(emptyRegistry);

      const result = factory.wrapSensitiveService(mockToken, testService, mockTokens);

      // Should return service unchanged when no strategy found
      expect(result).toBe(testService);
      expect(result.value).toBe(42);
    });

    it("should return service unchanged when all strategies return false for supports", () => {
      const registry = new ApiWrapperStrategyRegistry();
      const strategy = {
        supports: () => false, // Strategy exists but doesn't support this token
        wrap: () => ({ value: 999 }) as TestService,
      };
      registry.register(strategy);
      factory = new ServiceWrapperFactory(registry);

      const result = factory.wrapSensitiveService(mockToken, testService, mockTokens);

      // Should return service unchanged when no strategy matches
      expect(result).toBe(testService);
      expect(result.value).toBe(42);
    });
  });
});
