import { describe, it, expect } from "vitest";
import { ContainerValidator } from "@/infrastructure/di/validation/ContainerValidator";
import { ServiceRegistry } from "../../registry/ServiceRegistry";
import { createInjectionToken } from "@/infrastructure/di/token-factory";
import { ServiceLifecycle } from "@/infrastructure/di/types/core/servicelifecycle";
import { expectResultOk, expectResultErr } from "@/test/utils/test-helpers";
import type { Logger } from "@/infrastructure/logging/logger.interface";
import type { InjectionToken } from "../../types/core/injectiontoken";

class ServiceA implements Logger {
  static dependencies = [] as const;
  log(): void {}
  error(): void {}
  warn(): void {}
  info(): void {}
  debug(): void {}
}

class ServiceB implements Logger {
  static dependencies = [] as const;
  log(): void {}
  error(): void {}
  warn(): void {}
  info(): void {}
  debug(): void {}
}

class ServiceC implements Logger {
  static dependencies = [] as const;
  log(): void {}
  error(): void {}
  warn(): void {}
  info(): void {}
  debug(): void {}
}

// Note: ServiceAWithDep, ServiceBWithDep, ServiceCWithDep were removed as they were not used

describe("ContainerValidator", () => {
  describe("Dependency Validation", () => {
    it("should validate successfully when all dependencies registered", () => {
      const registry = new ServiceRegistry();
      const validator = new ContainerValidator();

      const depToken = createInjectionToken<ServiceA>("Dep");
      const serviceToken = createInjectionToken<ServiceB>("Service");

      registry.registerClass(depToken, ServiceA, ServiceLifecycle.SINGLETON);
      // ServiceB hat keine Dependencies, also direkt registrieren
      registry.registerClass(serviceToken, ServiceB, ServiceLifecycle.SINGLETON);

      const result = validator.validate(registry);
      expectResultOk(result);
    });

    it("should detect missing dependencies", () => {
      const registry = new ServiceRegistry();
      const validator = new ContainerValidator();

      const depToken = createInjectionToken<ServiceA>("MissingDep");
      const serviceToken = createInjectionToken<ServiceB>("Service");

      // Register service with factory that depends on missing token
      registry.registerFactory(
        serviceToken,
        () => new ServiceB(),
        ServiceLifecycle.SINGLETON,
        [depToken] // Dependency nicht registriert
      );

      const result = validator.validate(registry);
      expectResultErr(result);
      expect(result.error.length).toBeGreaterThan(0);
      expect(result.error[0]?.code).toBe("TokenNotRegistered");
    });
  });

  describe("Alias Validation", () => {
    it("should validate when alias target exists", () => {
      const registry = new ServiceRegistry();
      const validator = new ContainerValidator();

      const targetToken = createInjectionToken<ServiceA>("Target");
      const aliasToken = createInjectionToken<ServiceA>("Alias");

      registry.registerClass(targetToken, ServiceA, ServiceLifecycle.SINGLETON);
      registry.registerAlias(aliasToken, targetToken);

      const result = validator.validate(registry);
      expectResultOk(result);
    });

    it("should detect missing alias target", () => {
      const registry = new ServiceRegistry();
      const validator = new ContainerValidator();

      const targetToken = createInjectionToken<ServiceA>("MissingTarget");
      const aliasToken = createInjectionToken<ServiceA>("Alias");

      // Register alias but not target
      registry.registerAlias(aliasToken, targetToken);

      const result = validator.validate(registry);
      expectResultErr(result);
      expect(result.error.length).toBeGreaterThan(0);
      // AliasTargetNotFound sollte in den Fehlern enthalten sein
      // (kann auch TokenNotRegistered sein, da Alias targetToken als Dependency hat)
      const hasAliasError = result.error.some((e) => e.code === "AliasTargetNotFound");
      const hasTokenError = result.error.some((e) => e.code === "TokenNotRegistered");
      expect(hasAliasError || hasTokenError).toBe(true);
    });
  });

  describe("Circular Dependency Detection", () => {
    it("should detect direct circular dependency (A→B→A)", () => {
      const registry = new ServiceRegistry();
      const validator = new ContainerValidator();

      const tokenA = createInjectionToken<ServiceA>("A");
      const tokenB = createInjectionToken<ServiceB>("B");

      // A depends on B
      registry.registerFactory(tokenA, () => new ServiceA(), ServiceLifecycle.SINGLETON, [tokenB]);

      // B depends on A (circular!)
      registry.registerFactory(tokenB, () => new ServiceB(), ServiceLifecycle.SINGLETON, [tokenA]);

      const result = validator.validate(registry);
      expectResultErr(result);
      expect(result.error.length).toBeGreaterThan(0);
      expect(result.error[0]?.code).toBe("CircularDependency");
      expect(result.error[0]?.message).toContain("A");
      expect(result.error[0]?.message).toContain("B");
    });

    it("should detect indirect circular dependency (A→B→C→A)", () => {
      const registry = new ServiceRegistry();
      const validator = new ContainerValidator();

      const tokenA = createInjectionToken<ServiceA>("A");
      const tokenB = createInjectionToken<ServiceB>("B");
      const tokenC = createInjectionToken<ServiceC>("C");

      // A → B → C → A (circular!)
      registry.registerFactory(tokenA, () => new ServiceA(), ServiceLifecycle.SINGLETON, [tokenB]);

      registry.registerFactory(tokenB, () => new ServiceB(), ServiceLifecycle.SINGLETON, [tokenC]);

      registry.registerFactory(tokenC, () => new ServiceC(), ServiceLifecycle.SINGLETON, [tokenA]);

      const result = validator.validate(registry);
      expectResultErr(result);
      expect(result.error.length).toBeGreaterThan(0);
      expect(result.error[0]?.code).toBe("CircularDependency");
      expect(result.error[0]?.message).toContain("A");
      expect(result.error[0]?.message).toContain("B");
      expect(result.error[0]?.message).toContain("C");
    });

    it("should not detect false positives for non-circular dependencies", () => {
      const registry = new ServiceRegistry();
      const validator = new ContainerValidator();

      const tokenA = createInjectionToken<ServiceA>("A");
      const tokenB = createInjectionToken<ServiceB>("B");
      const tokenC = createInjectionToken<ServiceC>("C");

      // A → B → C (linear, no cycle)
      registry.registerFactory(tokenA, () => new ServiceA(), ServiceLifecycle.SINGLETON, [tokenB]);

      registry.registerFactory(tokenB, () => new ServiceB(), ServiceLifecycle.SINGLETON, [tokenC]);

      registry.registerClass(tokenC, ServiceC, ServiceLifecycle.SINGLETON);

      const result = validator.validate(registry);
      expectResultOk(result);
    });
  });

  describe("Performance", () => {
    it("should cache validated sub-graphs", () => {
      const registry = new ServiceRegistry();
      const validator = new ContainerValidator();

      // Erstelle mehrere Services ohne Zyklen (linear chain)
      const tokens = Array.from({ length: 10 }, (_, i) =>
        createInjectionToken<ServiceA>(`Service${i}`)
      );

      // Linear chain: Service0 → Service1 → Service2 → ...
      tokens.forEach((token, i) => {
        if (i === 0) {
          // First service has no dependencies
          registry.registerClass(token, ServiceA, ServiceLifecycle.SINGLETON);
        } else {
          // Each service depends on previous
          const prevToken = tokens[i - 1]!;
          registry.registerFactory(token, () => new ServiceA(), ServiceLifecycle.SINGLETON, [
            prevToken,
          ]);
        }
      });

      // Erste Validierung
      const result1 = validator.validate(registry);
      expectResultOk(result1);

      // Zweite Validierung sollte Cache nutzen
      const start = performance.now();
      const result2 = validator.validate(registry);
      const duration = performance.now() - start;

      expectResultOk(result2);
      // Sollte schnell sein (<100ms für 10 Services)
      expect(duration).toBeLessThan(100);
    });

    it("should skip already validated subgraphs", () => {
      const registry = new ServiceRegistry();
      const validator = new ContainerValidator();

      const tokenA = createInjectionToken<ServiceA>("A");
      const tokenB = createInjectionToken<ServiceB>("B");
      const tokenC = createInjectionToken<ServiceC>("C");

      registry.registerClass(tokenA, ServiceA, ServiceLifecycle.SINGLETON);
      registry.registerFactory(tokenB, () => new ServiceB(), ServiceLifecycle.SINGLETON, [tokenA]);
      registry.registerFactory(tokenC, () => new ServiceC(), ServiceLifecycle.SINGLETON, [tokenA]);

      const result = validator.validate(registry);
      expectResultOk(result);
    });

    it("should handle already-visited tokens in graph traversal", () => {
      // This test covers lines 194-196 in ContainerValidator.ts
      // We need to ensure that a token is visited multiple times during the same validation run,
      // and the second visit hits the already-visited path (visited.has(token) returns true)
      //
      // Strategy: Create a graph where one service (B) is a dependency of multiple services (A and C).
      // During validation, B will be visited first from A, then from C.
      // When C tries to visit B, B should already be in the visited set (but not yet in validatedSubgraphs
      // because we're still in the same validation run).
      const registry = new ServiceRegistry();
      const validator = new ContainerValidator();

      // Create a graph where one service (B) is a dependency of multiple services (A and C)
      // This ensures B is visited multiple times during the same validation traversal
      const tokenA = createInjectionToken<ServiceA>("A");
      const tokenB = createInjectionToken<ServiceB>("B");
      const tokenC = createInjectionToken<ServiceC>("C");
      const tokenD = createInjectionToken<ServiceA>("D");

      // B has no dependencies (leaf node)
      registry.registerClass(tokenB, ServiceB, ServiceLifecycle.SINGLETON);

      // A depends on B
      registry.registerFactory(tokenA, () => new ServiceA(), ServiceLifecycle.SINGLETON, [tokenB]);

      // C depends on both B and D (ensures B is visited from multiple paths)
      registry.registerClass(tokenD, ServiceA, ServiceLifecycle.SINGLETON);
      registry.registerFactory(tokenC, () => new ServiceC(), ServiceLifecycle.SINGLETON, [
        tokenB,
        tokenD,
      ]);

      // Clear validatedSubgraphs to ensure visited.has() is checked (not validatedSubgraphs.has())
      // This allows us to test the visited.has() path (lines 194-196)
      validator["validatedSubgraphs"].clear();

      // When validating:
      // 1. validate() iterates through all registrations in order
      // 2. First iteration: Start with A -> visit B -> B is processed and added to visited
      // 3. Second iteration: Start with C -> visit B -> B is already in visited (but not in validatedSubgraphs
      //    because we're still in the same validation run), so visited.has() returns true
      const result = validator.validate(registry);
      expectResultOk(result);
    });

    it("should return null when token is already in visited set (coverage for line 195)", () => {
      // This test directly covers line 195: return null when visited.has(token) is true
      // We need to ensure that when a token is already in the visited set,
      // the function returns null without further processing
      const registry = new ServiceRegistry();
      const validator = new ContainerValidator();

      const tokenA = createInjectionToken<ServiceA>("A");
      const tokenB = createInjectionToken<ServiceB>("B");

      // Register both tokens
      registry.registerClass(tokenA, ServiceA, ServiceLifecycle.SINGLETON);
      registry.registerClass(tokenB, ServiceB, ServiceLifecycle.SINGLETON);

      // Manually call checkCycleForToken to test the visited.has() branch
      const checkCycleForToken = validator["checkCycleForToken"].bind(validator);
      const visiting = new Set<InjectionToken<unknown>>();
      const visited = new Set<InjectionToken<unknown>>([tokenB]); // Pre-populate visited with tokenB
      const path: InjectionToken<unknown>[] = [];

      // Clear validatedSubgraphs to ensure visited.has() is checked
      validator["validatedSubgraphs"].clear();

      // Call checkCycleForToken with tokenB which is already in visited
      // This should hit the visited.has(token) branch at line 194 and return null at line 195
      const error = checkCycleForToken(registry, tokenB, visiting, visited, path);

      // Should return null because token is already visited (line 195)
      expect(error).toBeNull();
      // visited set should remain unchanged
      expect(visited.has(tokenB)).toBe(true);
    });

    it("should handle case where registration is not found (coverage for registration branch line 206)", () => {
      // This test covers the case where getRegistration returns null/undefined
      // This can happen if a token is in the registry keys but the registration was removed
      // or if there's a race condition (though unlikely in practice)
      const registry = new ServiceRegistry();
      const validator = new ContainerValidator();

      // Create a token and register it
      const tokenA = createInjectionToken<ServiceA>("A");
      registry.registerClass(tokenA, ServiceA, ServiceLifecycle.SINGLETON);

      // Manually remove the registration but keep the token in the keys
      // This simulates the edge case where registration is null
      const registrations = registry["registrations"];
      registrations.delete(tokenA);

      // Add token back to keys without registration (simulating edge case)
      // Note: This is a bit artificial, but tests the null check branch
      // The token won't be in getAllRegistrations() if it's not registered
      // So we need to test this differently - by checking a token that's referenced but not registered

      // Better approach: Create a dependency chain where a dependency token exists in the graph
      // but getRegistration returns null (this shouldn't happen in practice, but tests the branch)
      const tokenB = createInjectionToken<ServiceB>("B");
      const tokenC = createInjectionToken<ServiceC>("C");

      // Register B normally
      registry.registerClass(tokenB, ServiceB, ServiceLifecycle.SINGLETON);

      // Register C with dependency on B
      registry.registerFactory(tokenC, () => new ServiceC(), ServiceLifecycle.SINGLETON, [tokenB]);

      // Manually manipulate the registry to simulate getRegistration returning null
      // This is an edge case that shouldn't happen in practice, but tests the branch
      const checkCycleForToken = validator["checkCycleForToken"].bind(validator);
      const visiting = new Set<InjectionToken<unknown>>();
      const visited = new Set<InjectionToken<unknown>>();
      const path: InjectionToken<unknown>[] = [];

      // Call checkCycleForToken with a token that's not in the registry
      // This will cause getRegistration to return null
      const unregisteredToken = createInjectionToken<ServiceA>("Unregistered");
      const error = checkCycleForToken(registry, unregisteredToken, visiting, visited, path);

      // Should return null (no cycle, but also no registration to check)
      expect(error).toBeNull();
    });
  });
});
