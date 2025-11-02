import { describe, it, expect } from "vitest";
import { ScopeManager } from "../ScopeManager";
import { InstanceCache } from "../../cache/InstanceCache";
import { expectResultOk, expectResultErr } from "@/test/utils/test-helpers";

class DisposableService {
  disposed = false;
  dispose(): void {
    this.disposed = true;
  }
}

class NonDisposableService {
  value = 42;
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

    it("should continue disposal even if child disposal fails", () => {
      const parentCache = new InstanceCache();
      const parentManager = new ScopeManager("parent", null, parentCache);

      const childResult = parentManager.createChild("child");
      expectResultOk(childResult);
      const child = childResult.value.manager;

      // Dispose child first
      child.dispose();

      // Try to dispose child again (should fail)
      const childDisposeResult = child.dispose();
      expectResultErr(childDisposeResult);

      // Parent disposal should still succeed
      const parentDisposeResult = parentManager.dispose();
      expectResultOk(parentDisposeResult);
    });

    it("should handle disposable instances that throw", () => {
      const cache = new InstanceCache();
      const manager = new ScopeManager("root", null, cache);

      class FailingDisposable {
        dispose(): void {
          throw new Error("Disposal failed");
        }
      }

      const token = Symbol("FailingDisposable");
      cache.set(token, new FailingDisposable());

      const result = manager.dispose();
      expectResultErr(result);
      expect(result.error.code).toBe("DisposalFailed");
    });
  });
});

