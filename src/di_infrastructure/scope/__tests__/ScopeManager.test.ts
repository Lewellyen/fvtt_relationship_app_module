/* eslint-disable @typescript-eslint/no-explicit-any */
// Test file: `any` needed for testing Disposable instances

import { describe, it, expect } from "vitest";
import { ScopeManager } from "../ScopeManager";
import { InstanceCache } from "../../cache/InstanceCache";
import { expectResultOk, expectResultErr } from "@/test/utils/test-helpers";
import type { Logger } from "@/interfaces/logger";

class DisposableService implements Logger {
  disposed = false;
  dispose(): void {
    this.disposed = true;
  }
  log(): void {}
  error(): void {}
  warn(): void {}
  info(): void {}
  debug(): void {}
}

class NonDisposableService implements Logger {
  value = 42;
  log(): void {}
  error(): void {}
  warn(): void {}
  info(): void {}
  debug(): void {}
}

describe("ScopeManager", () => {
  describe("Scope Creation", () => {
    it("should create root scope", () => {
      const cache = new InstanceCache();
      const manager = new ScopeManager("root", null, cache);

      expect(manager.getScopeName()).toBe("root");
      expect(manager.isDisposed()).toBe(false);
    });

    it("should create child scope", () => {
      const parentCache = new InstanceCache();
      const parentManager = new ScopeManager("parent", null, parentCache);

      const childResult = parentManager.createChild("child");
      expectResultOk(childResult);

      expect(childResult.value.scopeName).toContain("parent.child");
      expect(childResult.value.manager.getScopeName()).toContain("parent.child");
      expect(childResult.value.manager.isDisposed()).toBe(false);
    });

    it("should generate unique scope names", () => {
      const cache = new InstanceCache();
      const manager = new ScopeManager("root", null, cache);

      const child1Result = manager.createChild();
      expectResultOk(child1Result);

      const child2Result = manager.createChild();
      expectResultOk(child2Result);

      expect(child1Result.value.scopeName).not.toBe(child2Result.value.scopeName);
    });

    it("should use custom scope name when provided", () => {
      const cache = new InstanceCache();
      const manager = new ScopeManager("root", null, cache);

      const childResult = manager.createChild("custom");
      expectResultOk(childResult);

      expect(childResult.value.scopeName).toBe("root.custom");
    });

    it("should fail when max depth exceeded", () => {
      const cache = new InstanceCache();
      let manager = new ScopeManager("root", null, cache, 0);

      // Create nested scopes up to max depth
      for (let i = 0; i < 10; i++) {
        const childResult = manager.createChild(`level${i}`);
        expectResultOk(childResult);
        manager = childResult.value.manager;
      }

      // Next child should fail
      const result = manager.createChild("should-fail");
      expectResultErr(result);
      expect(result.error.code).toBe("MaxScopeDepthExceeded");
      expect(result.error.message).toContain("Maximum scope depth");
    });

    it("should return scope name via getScopeName()", () => {
      const cache = new InstanceCache();
      const manager = new ScopeManager("test-scope", null, cache);

      expect(manager.getScopeName()).toBe("test-scope");
    });

    it("should return unique scope ID via getScopeId()", () => {
      const cache1 = new InstanceCache();
      const manager1 = new ScopeManager("root", null, cache1);

      const cache2 = new InstanceCache();
      const manager2 = new ScopeManager("root", null, cache2);

      const id1 = manager1.getScopeId();
      const id2 = manager2.getScopeId();

      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
      expect(id1).toContain("root-");
      expect(id2).toContain("root-");
    });

    it("should generate scope ID with timestamp and random component", () => {
      const cache = new InstanceCache();
      const manager = new ScopeManager("test", null, cache);

      const scopeId = manager.getScopeId();
      expect(scopeId).toMatch(/^test-\d+-[a-z0-9]+$/);
    });

    it("should use crypto.randomUUID when available", () => {
      const cache = new InstanceCache();
      const manager = new ScopeManager("root", null, cache);

      const childResult = manager.createChild();
      expectResultOk(childResult);

      // Should have generated a scope name with UUID format
      // UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
      expect(childResult.value.scopeName).toMatch(
        /^root\.scope-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
      );
    });

    it("should fallback to timestamp+random when crypto.randomUUID fails", () => {
      // Mock crypto.randomUUID by stubbing the method
      const originalRandomUUID = crypto.randomUUID;
      crypto.randomUUID = () => {
        throw new Error("crypto.randomUUID not available");
      };

      try {
        const cache = new InstanceCache();
        const manager = new ScopeManager("root", null, cache);

        const childResult = manager.createChild();
        expectResultOk(childResult);

        // Should have generated a scope name with fallback format (timestamp-random)
        expect(childResult.value.scopeName).toMatch(/^root\.scope-\d+-\d+(\.\d+)?$/);
      } finally {
        // Restore original crypto.randomUUID
        crypto.randomUUID = originalRandomUUID;
      }
    });
  });

  describe("Disposal", () => {
    it("should dispose scope successfully", () => {
      const cache = new InstanceCache();
      const manager = new ScopeManager("root", null, cache);

      const result = manager.dispose();
      expectResultOk(result);
      expect(manager.isDisposed()).toBe(true);
    });

    it("should fail disposal on already disposed scope", () => {
      const cache = new InstanceCache();
      const manager = new ScopeManager("root", null, cache);

      manager.dispose();
      const result = manager.dispose();

      expectResultErr(result);
      expect(result.error.code).toBe("Disposed");
    });

    it("should dispose disposable instances", () => {
      const cache = new InstanceCache();
      const manager = new ScopeManager("root", null, cache);

      const disposable = new DisposableService();
      const token = Symbol("DisposableService");
      cache.set(token, disposable);

      const result = manager.dispose();
      expectResultOk(result);
      expect(disposable.disposed).toBe(true);
    });

    it("should not dispose non-disposable instances", () => {
      const cache = new InstanceCache();
      const manager = new ScopeManager("root", null, cache);

      const nonDisposable = new NonDisposableService();
      const token = Symbol("NonDisposableService");
      cache.set(token, nonDisposable);

      const result = manager.dispose();
      expectResultOk(result);
      expect(nonDisposable.value).toBe(42);
    });

    it("should clear cache after disposal", () => {
      const cache = new InstanceCache();
      const manager = new ScopeManager("root", null, cache);

      const token = Symbol("Service");
      cache.set(token, new NonDisposableService());

      manager.dispose();
      expect(cache.has(token)).toBe(false);
    });
  });

  describe("Cascading Disposal", () => {
    it("should dispose children before parent", () => {
      const parentCache = new InstanceCache();
      const parentManager = new ScopeManager("parent", null, parentCache);

      const child1Result = parentManager.createChild("child1");
      expectResultOk(child1Result);
      const child1 = child1Result.value.manager;

      const child2Result = parentManager.createChild("child2");
      expectResultOk(child2Result);
      const child2 = child2Result.value.manager;

      // Add disposables to children
      const disposable1 = new DisposableService();
      const token1 = Symbol("Child1Service");
      child1Result.value.cache.set(token1, disposable1);

      const disposable2 = new DisposableService();
      const token2 = Symbol("Child2Service");
      child2Result.value.cache.set(token2, disposable2);

      // Dispose parent
      const result = parentManager.dispose();
      expectResultOk(result);

      // Children should be disposed
      expect(child1.isDisposed()).toBe(true);
      expect(child2.isDisposed()).toBe(true);
      expect(disposable1.disposed).toBe(true);
      expect(disposable2.disposed).toBe(true);
    });

    it("should remove child from parent's children set on disposal", () => {
      const parentCache = new InstanceCache();
      const parentManager = new ScopeManager("parent", null, parentCache);

      const childResult = parentManager.createChild("child");
      expectResultOk(childResult);
      const child = childResult.value.manager;

      // Child should be in parent's children set
      expect((parentManager as any).children.has(child)).toBe(true);

      child.dispose();

      // Child should be removed from parent's children set
      expect((parentManager as any).children.has(child)).toBe(false);
    });

    it("should handle nested child disposal", () => {
      const rootCache = new InstanceCache();
      const rootManager = new ScopeManager("root", null, rootCache);

      const child1Result = rootManager.createChild("child1");
      expectResultOk(child1Result);
      const child1 = child1Result.value.manager;

      const grandchildResult = child1.createChild("grandchild");
      expectResultOk(grandchildResult);
      const grandchild = grandchildResult.value.manager;

      const disposable = new DisposableService();
      const token = Symbol("GrandchildService");
      grandchildResult.value.cache.set(token, disposable);

      // Dispose root should cascade to all children
      rootManager.dispose();

      expect(rootManager.isDisposed()).toBe(true);
      expect(child1.isDisposed()).toBe(true);
      expect(grandchild.isDisposed()).toBe(true);
      expect(disposable.disposed).toBe(true);
    });
  });

  describe("Error Handling", () => {
    it("should fail to create child from disposed scope", () => {
      const cache = new InstanceCache();
      const manager = new ScopeManager("root", null, cache);

      manager.dispose();

      const result = manager.createChild("child");
      expectResultErr(result);
      expect(result.error.code).toBe("Disposed");
    });

    it("should return PartialDisposal error when children fail to dispose", () => {
      const parentCache = new InstanceCache();
      const parentManager = new ScopeManager("parent", null, parentCache);

      // Create child with a disposable that will fail
      const childResult = parentManager.createChild("child1");
      expectResultOk(childResult);

      // Add a failing disposable to child
      class FailingDisposable implements Logger {
        dispose(): void {
          throw new Error("Disposal intentionally failed");
        }
        log(): void {}
        debug(): void {}
        info(): void {}
        warn(): void {}
        error(): void {}
      }

      const failingDisposable = new FailingDisposable();
      childResult.value.cache.set(Symbol("failing"), failingDisposable);

      // When parent tries to dispose, child will fail
      const parentDisposeResult = parentManager.dispose();

      expectResultErr(parentDisposeResult);
      expect(parentDisposeResult.error.code).toBe("PartialDisposal");
      expect(parentDisposeResult.error.message).toContain("Failed to dispose");
      expect(parentDisposeResult.error.message).toContain("child scope");
      expect(parentDisposeResult.error.details).toBeDefined();

      // Parent should still be disposed despite child errors
      expect(parentManager.isDisposed()).toBe(true);
    });

    it("should handle disposable instances that throw", () => {
      const cache = new InstanceCache();
      const manager = new ScopeManager("root", null, cache);

      class FailingDisposable implements Logger {
        dispose(): void {
          throw new Error("Disposal failed");
        }
        log(): void {}
        error(): void {}
        warn(): void {}
        info(): void {}
        debug(): void {}
      }

      const token = Symbol("FailingDisposable");
      cache.set(token, new FailingDisposable());

      const result = manager.dispose();
      expectResultErr(result);
      expect(result.error.code).toBe("DisposalFailed");
    });

    it("should handle async disposable instances that throw", async () => {
      const cache = new InstanceCache();
      const manager = new ScopeManager("root", null, cache);

      class FailingAsyncDisposable implements Logger {
        async disposeAsync(): Promise<void> {
          throw new Error("Async disposal failed");
        }
        log(): void {}
        error(): void {}
        warn(): void {}
        info(): void {}
        debug(): void {}
      }

      const token = Symbol("FailingAsyncDisposable");
      cache.set(token, new FailingAsyncDisposable());

      const result = await manager.disposeAsync();
      expectResultErr(result);
      expect(result.error.code).toBe("DisposalFailed");
      expect(result.error.message).toContain("Async disposal failed");
    });

    it("should handle mixed sync and async disposables with errors", async () => {
      const cache = new InstanceCache();
      const manager = new ScopeManager("root", null, cache);

      class FailingSyncDisposable implements Logger {
        dispose(): void {
          throw new Error("Sync disposal failed");
        }
        log(): void {}
        error(): void {}
        warn(): void {}
        info(): void {}
        debug(): void {}
      }

      class FailingAsyncDisposable implements Logger {
        async disposeAsync(): Promise<void> {
          throw new Error("Async disposal failed");
        }
        log(): void {}
        error(): void {}
        warn(): void {}
        info(): void {}
        debug(): void {}
      }

      const token1 = Symbol("FailingSync");
      const token2 = Symbol("FailingAsync");
      cache.set(token1, new FailingSyncDisposable());
      cache.set(token2, new FailingAsyncDisposable());

      // disposeAsync should handle both sync and async failures
      const result = await manager.disposeAsync();
      expectResultErr(result);
      expect(result.error.code).toBe("DisposalFailed");
    });

    it("should prefer async dispose when both sync and async are available", async () => {
      const cache = new InstanceCache();
      const manager = new ScopeManager("root", null, cache);

      let syncDisposeCalled = false;
      let asyncDisposeCalled = false;

      class DisposableWithBoth implements Logger {
        dispose(): void {
          syncDisposeCalled = true;
        }
        async disposeAsync(): Promise<void> {
          asyncDisposeCalled = true;
        }
        log(): void {}
        error(): void {}
        warn(): void {}
        info(): void {}
        debug(): void {}
      }

      const token = Symbol("DisposableWithBoth");
      cache.set(token, new DisposableWithBoth());

      const result = await manager.disposeAsync();

      expectResultOk(result);
      // Async dispose should be preferred
      expect(asyncDisposeCalled).toBe(true);
      // Sync dispose should not be called when async is available
      expect(syncDisposeCalled).toBe(false);
    });
  });

  describe("Child Disposal Error Handling", () => {
    it("should collect child disposal errors (sync)", () => {
      const parentCache = new InstanceCache();
      const parentManager = new ScopeManager("parent", null, parentCache);

      // Create two children
      const child1Result = parentManager.createChild("child1");
      expectResultOk(child1Result);

      const child2Result = parentManager.createChild("child2");
      expectResultOk(child2Result);

      // Add a failing disposable to child1
      const failingDisposable = {
        dispose() {
          throw new Error("Disposal failed");
        },
      };
      child1Result.value.cache.set(Symbol("Failing"), failingDisposable as any);

      // Dispose parent - should collect child1 error
      const result = parentManager.dispose();

      expectResultErr(result);
      expect(result.error.code).toBe("PartialDisposal");
      expect(result.error.message).toContain("1 child scope");
      expect(result.error.details).toBeDefined();
      expect(Array.isArray(result.error.details)).toBe(true);
      if (Array.isArray(result.error.details)) {
        expect(result.error.details).toHaveLength(1);
        expect(result.error.details[0].scopeName).toBe("parent.child1");
      }
    });

    it("should collect child disposal errors (async)", async () => {
      const parentCache = new InstanceCache();
      const parentManager = new ScopeManager("parent", null, parentCache);

      // Create two children
      const child1Result = parentManager.createChild("child1");
      expectResultOk(child1Result);

      const child2Result = parentManager.createChild("child2");
      expectResultOk(child2Result);

      // Add a failing async disposable to child1
      const failingAsyncDisposable = {
        async disposeAsync() {
          throw new Error("Async disposal failed");
        },
      };
      child1Result.value.cache.set(Symbol("FailingAsync"), failingAsyncDisposable as any);

      // Dispose parent async - should collect child1 error
      const result = await parentManager.disposeAsync();

      expectResultErr(result);
      expect(result.error.code).toBe("PartialDisposal");
      expect(result.error.message).toContain("1 child scope");
      expect(result.error.details).toBeDefined();
      expect(Array.isArray(result.error.details)).toBe(true);
      if (Array.isArray(result.error.details)) {
        expect(result.error.details).toHaveLength(1);
        expect(result.error.details[0].scopeName).toBe("parent.child1");
      }
    });

    it("should remove child from parent on disposal", () => {
      const parentCache = new InstanceCache();
      const parentManager = new ScopeManager("parent", null, parentCache);

      const childResult = parentManager.createChild("child");
      expectResultOk(childResult);
      const child = childResult.value.manager;

      // Child should be in parent's children set

      expect((parentManager as any).children.has(child)).toBe(true);

      // Dispose child
      child.dispose();

      // Child should be removed from parent's children set

      expect((parentManager as any).children.has(child)).toBe(false);
    });

    it("should fail double disposal (async)", async () => {
      const cache = new InstanceCache();
      const manager = new ScopeManager("test", null, cache);

      // First disposal
      await manager.disposeAsync();

      // Second disposal should fail
      const result = await manager.disposeAsync();

      expectResultErr(result);
      expect(result.error.code).toBe("Disposed");
      expect(result.error.message).toContain("already disposed");
    });
  });
});
