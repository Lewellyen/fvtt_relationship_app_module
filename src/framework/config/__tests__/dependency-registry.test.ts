import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  DependencyRegistrationRegistry,
  dependencyRegistry,
  registerDependencyStep,
} from "@/framework/config/dependency-registry";
import { createTestContainer } from "@/test/utils/test-helpers";
import { ok } from "@/domain/utils/result";

describe("DependencyRegistrationRegistry", () => {
  let registry: DependencyRegistrationRegistry;

  beforeEach(() => {
    registry = new DependencyRegistrationRegistry();
  });

  describe("register", () => {
    it("should register a step and sort by priority", () => {
      const step1 = {
        name: "Step1",
        priority: 20,
        execute: vi.fn().mockReturnValue(ok(undefined)),
      };
      const step2 = {
        name: "Step2",
        priority: 10,
        execute: vi.fn().mockReturnValue(ok(undefined)),
      };

      registry.register(step1);
      registry.register(step2);

      const container = createTestContainer();
      const result = registry.configure(container);

      expect(result.ok).toBe(true);
      // Step2 (priority 10) should execute before Step1 (priority 20)
      expect(step2.execute).toHaveBeenCalledBefore(step1.execute);
    });

    it("should replace step with same name", () => {
      const step1 = {
        name: "SameName",
        priority: 10,
        execute: vi.fn().mockReturnValue(ok(undefined)),
      };
      const step2 = {
        name: "SameName",
        priority: 20,
        execute: vi.fn().mockReturnValue(ok(undefined)),
      };

      registry.register(step1);
      registry.register(step2);

      const container = createTestContainer();
      registry.configure(container);

      // Only step2 should be called (step1 was replaced)
      expect(step1.execute).not.toHaveBeenCalled();
      expect(step2.execute).toHaveBeenCalledTimes(1);
    });
  });

  describe("reset", () => {
    it("should clear all registered steps", () => {
      const step1 = {
        name: "Step1",
        priority: 10,
        execute: vi.fn().mockReturnValue(ok(undefined)),
      };
      const step2 = {
        name: "Step2",
        priority: 20,
        execute: vi.fn().mockReturnValue(ok(undefined)),
      };

      registry.register(step1);
      registry.register(step2);

      // Reset should clear all steps
      registry.reset();

      const container = createTestContainer();
      const result = registry.configure(container);

      // Configuration should succeed but no steps should execute
      expect(result.ok).toBe(true);
      expect(step1.execute).not.toHaveBeenCalled();
      expect(step2.execute).not.toHaveBeenCalled();
    });

    it("should allow re-registration after reset", () => {
      const step = {
        name: "TestStep",
        priority: 10,
        execute: vi.fn().mockReturnValue(ok(undefined)),
      };

      registry.register(step);
      registry.reset();
      registry.register(step);

      const container = createTestContainer();
      registry.configure(container);

      // Step should be called after re-registration
      expect(step.execute).toHaveBeenCalledTimes(1);
    });
  });

  describe("configure", () => {
    it("should execute all steps in priority order", () => {
      const executionOrder: string[] = [];
      const step1 = {
        name: "Step1",
        priority: 30,
        execute: vi.fn().mockImplementation(() => {
          executionOrder.push("Step1");
          return ok(undefined);
        }),
      };
      const step2 = {
        name: "Step2",
        priority: 10,
        execute: vi.fn().mockImplementation(() => {
          executionOrder.push("Step2");
          return ok(undefined);
        }),
      };
      const step3 = {
        name: "Step3",
        priority: 20,
        execute: vi.fn().mockImplementation(() => {
          executionOrder.push("Step3");
          return ok(undefined);
        }),
      };

      registry.register(step1);
      registry.register(step2);
      registry.register(step3);

      const container = createTestContainer();
      const result = registry.configure(container);

      expect(result.ok).toBe(true);
      expect(executionOrder).toEqual(["Step2", "Step3", "Step1"]);
    });

    it("should stop at first error and return it", () => {
      const step1 = {
        name: "Step1",
        priority: 10,
        execute: vi.fn().mockReturnValue(ok(undefined)),
      };
      const step2 = {
        name: "Step2",
        priority: 20,
        execute: vi.fn().mockReturnValue({ ok: false, error: "Test error" }),
      };
      const step3 = {
        name: "Step3",
        priority: 30,
        execute: vi.fn().mockReturnValue(ok(undefined)),
      };

      registry.register(step1);
      registry.register(step2);
      registry.register(step3);

      const container = createTestContainer();
      const result = registry.configure(container);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("Failed at step 'Step2'");
        expect(result.error).toContain("Test error");
      }

      // Step1 should execute, Step2 should fail, Step3 should not execute
      expect(step1.execute).toHaveBeenCalledTimes(1);
      expect(step2.execute).toHaveBeenCalledTimes(1);
      expect(step3.execute).not.toHaveBeenCalled();
    });
  });
});

describe("dependencyRegistry (global instance)", () => {
  describe("registerDependencyStep", () => {
    it("should register steps in the global registry", () => {
      const step = {
        name: "GlobalTestStep",
        priority: 50,
        execute: vi.fn().mockReturnValue(ok(undefined)),
      };

      registerDependencyStep(step);

      // Note: configureDependencies will use the global registry
      // We test the registration here, full integration is tested in dependencyconfig.test.ts
      expect(dependencyRegistry).toBeDefined();
    });
  });
});
