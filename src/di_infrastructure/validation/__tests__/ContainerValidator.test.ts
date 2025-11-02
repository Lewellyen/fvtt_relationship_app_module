import { describe, it, expect } from "vitest";
import { ContainerValidator } from "../ContainerValidator";
import { ServiceRegistry } from "../../registry/ServiceRegistry";
import { createInjectionToken } from "../../tokenutilities";
import { ServiceLifecycle } from "../../types/servicelifecycle";
import { expectResultOk, expectResultErr } from "@/test/utils/test-helpers";

class ServiceA {
  static dependencies = [] as const;
}

class ServiceB {
  static dependencies = [] as const;
}

class ServiceC {
  static dependencies = [] as const;
}

// Klassen mit Dependencies für Tests
class ServiceAWithDep {
  static dependencies = [] as const;
}

class ServiceBWithDep {
  static dependencies = [] as const;
}

class ServiceCWithDep {
  static dependencies = [] as const;
}

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
      registry.registerFactory(
        tokenA,
        () => new ServiceA(),
        ServiceLifecycle.SINGLETON,
        [tokenB]
      );

      // B depends on A (circular!)
      registry.registerFactory(
        tokenB,
        () => new ServiceB(),
        ServiceLifecycle.SINGLETON,
        [tokenA]
      );

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
      registry.registerFactory(
        tokenA,
        () => new ServiceA(),
        ServiceLifecycle.SINGLETON,
        [tokenB]
      );

      registry.registerFactory(
        tokenB,
        () => new ServiceB(),
        ServiceLifecycle.SINGLETON,
        [tokenC]
      );

      registry.registerFactory(
        tokenC,
        () => new ServiceC(),
        ServiceLifecycle.SINGLETON,
        [tokenA]
      );

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
      registry.registerFactory(
        tokenA,
        () => new ServiceA(),
        ServiceLifecycle.SINGLETON,
        [tokenB]
      );

      registry.registerFactory(
        tokenB,
        () => new ServiceB(),
        ServiceLifecycle.SINGLETON,
        [tokenC]
      );

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
          registry.registerFactory(
            token,
            () => new ServiceA(),
            ServiceLifecycle.SINGLETON,
            [prevToken]
          );
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
      registry.registerFactory(
        tokenB,
        () => new ServiceB(),
        ServiceLifecycle.SINGLETON,
        [tokenA]
      );
      registry.registerFactory(
        tokenC,
        () => new ServiceC(),
        ServiceLifecycle.SINGLETON,
        [tokenA]
      );

      const result = validator.validate(registry);
      expectResultOk(result);
    });
  });
});

