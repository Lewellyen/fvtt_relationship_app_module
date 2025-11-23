import { describe, it, expect } from "vitest";
import { ServiceContainer } from "@/infrastructure/di/container";
import { createInjectionToken } from "@/infrastructure/di/tokenutilities";
import { markAsApiSafe } from "@/infrastructure/di/types";
import { ServiceLifecycle } from "@/infrastructure/di/types";

// Helper for tests: Wrap tokens for resolve() testing (simulates external API usage)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const testResolve = <T>(container: ServiceContainer, token: any): T => {
  return container.resolve(markAsApiSafe(token)) as T;
};

// Test service types (not in production ServiceType union)
interface TestService {
  id: number;
}

describe("ServiceContainer - Edge Cases", () => {
  describe("Concurrent Resolution", () => {
    it("should handle concurrent singleton resolves safely", async () => {
      const container = ServiceContainer.createRoot();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const token = createInjectionToken<any>("TestService");
      let instanceCount = 0;

      container.registerFactory(
        token,
        () => {
          instanceCount++;
          return { id: instanceCount };
        },
        ServiceLifecycle.SINGLETON,
        []
      );

      container.validate();

      // Resolve same service 100 times in parallel
      const results: TestService[] = await Promise.all(
        Array(100)
          .fill(0)
          .map(() => Promise.resolve(testResolve<TestService>(container, token)))
      );

      // Should only create one instance (Singleton behavior)
      expect(instanceCount).toBe(1);
      expect(results.every((r) => r.id === 1)).toBe(true);
    });

    it("should handle concurrent validation calls", async () => {
      const container = ServiceContainer.createRoot();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const token = createInjectionToken<any>("Service");

      container.registerFactory(token, () => ({}), ServiceLifecycle.SINGLETON, []);

      // Call validateAsync multiple times concurrently
      const validations = await Promise.all([
        container.validateAsync(),
        container.validateAsync(),
        container.validateAsync(),
      ]);

      // All should succeed
      expect(validations.every((v) => v.ok)).toBe(true);
    });
  });

  describe("Circular Dependencies", () => {
    it("should detect direct circular dependency", () => {
      const container = ServiceContainer.createRoot();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tokenA = createInjectionToken<any>("ServiceA");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tokenB = createInjectionToken<any>("ServiceB");

      // A depends on B, B depends on A
      container.registerFactory(tokenA, () => ({}), ServiceLifecycle.SINGLETON, [tokenB]);
      container.registerFactory(tokenB, () => ({}), ServiceLifecycle.SINGLETON, [tokenA]);

      const result = container.validate();

      expect(result.ok).toBe(false);
      if (!result.ok) {
        const hasCircularDep = result.error.some((e) => e.code === "CircularDependency");
        expect(hasCircularDep).toBe(true);
      }
    });

    it("should detect indirect circular dependency (A→B→C→A)", () => {
      const container = ServiceContainer.createRoot();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tokenA = createInjectionToken<any>("A");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tokenB = createInjectionToken<any>("B");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tokenC = createInjectionToken<any>("C");

      // A → B → C → A
      container.registerFactory(tokenA, () => ({}), ServiceLifecycle.SINGLETON, [tokenB]);
      container.registerFactory(tokenB, () => ({}), ServiceLifecycle.SINGLETON, [tokenC]);
      container.registerFactory(tokenC, () => ({}), ServiceLifecycle.SINGLETON, [tokenA]);

      const result = container.validate();

      expect(result.ok).toBe(false);
    });
  });

  describe("Disposal", () => {
    it("should reject registerClass on disposed container", () => {
      const container = ServiceContainer.createRoot();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const token = createInjectionToken<any>("Service");

      container.dispose();

      const result = container.registerClass(token, class {}, ServiceLifecycle.SINGLETON);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("Disposed");
      }
    });

    it("should reject registerFactory on disposed container", () => {
      const container = ServiceContainer.createRoot();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const token = createInjectionToken<any>("Factory");

      container.dispose();

      const result = container.registerFactory(token, () => ({}), ServiceLifecycle.SINGLETON, []);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("Disposed");
      }
    });

    it("should reject registerValue on disposed container", () => {
      const container = ServiceContainer.createRoot();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const token = createInjectionToken<any>("Value");

      container.dispose();

      const result = container.registerValue(token, {});
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("Disposed");
      }
    });

    it("should reject registerAlias on disposed container", () => {
      const container = ServiceContainer.createRoot();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const targetToken = createInjectionToken<any>("Target");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const aliasToken = createInjectionToken<any>("Alias");

      container.registerClass(targetToken, class {}, ServiceLifecycle.SINGLETON);
      container.dispose();

      const result = container.registerAlias(aliasToken, targetToken);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("Disposed");
      }
    });

    it("should clean up all registered hooks on dispose (sync)", () => {
      const container = ServiceContainer.createRoot();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const token = createInjectionToken<any>("Disposable");

      let disposed = false;

      container.registerFactory(
        token,
        () => ({
          disposed: false,
          dispose() {
            disposed = true;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (this as any).disposed = true;
          },
        }),
        ServiceLifecycle.SINGLETON,
        []
      );

      container.validate();
      testResolve(container, token);

      // Dispose container
      const disposeResult = container.dispose();

      expect(disposeResult.ok).toBe(true);
      expect(disposed).toBe(true);
    });

    it("should clean up all registered hooks on disposeAsync (async)", async () => {
      const container = ServiceContainer.createRoot();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const token = createInjectionToken<any>("AsyncDisposable");

      let disposed = false;
      let asyncDisposed = false;

      container.registerFactory(
        token,
        () => ({
          disposed: false,
          async disposeAsync() {
            // Simulate async cleanup
            await new Promise((resolve) => setTimeout(resolve, 10));
            asyncDisposed = true;
            disposed = true;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (this as any).disposed = true;
          },
        }),
        ServiceLifecycle.SINGLETON,
        []
      );

      container.validate();
      testResolve(container, token);

      // Dispose container async
      const disposeResult = await container.disposeAsync();

      expect(disposeResult.ok).toBe(true);
      expect(disposed).toBe(true);
      expect(asyncDisposed).toBe(true);
    });

    it("should handle both sync and async disposables together", async () => {
      const container = ServiceContainer.createRoot();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const syncToken = createInjectionToken<any>("Sync");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const asyncToken = createInjectionToken<any>("Async");

      let syncDisposed = false;
      let asyncDisposed = false;

      container.registerFactory(
        syncToken,
        () => ({
          dispose() {
            syncDisposed = true;
          },
        }),
        ServiceLifecycle.SINGLETON,
        []
      );

      container.registerFactory(
        asyncToken,
        () => ({
          async disposeAsync() {
            await new Promise((resolve) => setTimeout(resolve, 10));
            asyncDisposed = true;
          },
        }),
        ServiceLifecycle.SINGLETON,
        []
      );

      container.validate();
      testResolve(container, syncToken);
      testResolve(container, asyncToken);

      // Dispose container async (handles both)
      const disposeResult = await container.disposeAsync();

      expect(disposeResult.ok).toBe(true);
      expect(syncDisposed).toBe(true);
      expect(asyncDisposed).toBe(true);
    });
  });
});
