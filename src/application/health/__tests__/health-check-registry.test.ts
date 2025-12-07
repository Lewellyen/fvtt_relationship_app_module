import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  HealthCheckRegistry,
  DIHealthCheckRegistry,
} from "@/application/health/HealthCheckRegistry";
import type { HealthCheck } from "../health-check.interface";

describe("HealthCheckRegistry", () => {
  let registry: HealthCheckRegistry;

  beforeEach(() => {
    registry = new HealthCheckRegistry();
  });

  describe("register", () => {
    it("should register a health check", () => {
      const check: HealthCheck = {
        name: "test",
        check: vi.fn().mockReturnValue(true),
        dispose: vi.fn(),
      };

      registry.register(check);

      expect(registry.getCheck("test")).toBe(check);
    });

    it("should allow registering multiple checks", () => {
      const check1: HealthCheck = {
        name: "check1",
        check: vi.fn().mockReturnValue(true),
        dispose: vi.fn(),
      };
      const check2: HealthCheck = {
        name: "check2",
        check: vi.fn().mockReturnValue(true),
        dispose: vi.fn(),
      };

      registry.register(check1);
      registry.register(check2);

      expect(registry.getAllChecks()).toHaveLength(2);
    });
  });

  describe("unregister", () => {
    it("should remove a health check", () => {
      const check: HealthCheck = {
        name: "test",
        check: vi.fn().mockReturnValue(true),
        dispose: vi.fn(),
      };

      registry.register(check);
      registry.unregister("test");

      expect(registry.getCheck("test")).toBeUndefined();
    });
  });

  describe("runAll", () => {
    it("should run all registered checks", () => {
      const check1: HealthCheck = {
        name: "check1",
        check: vi.fn().mockReturnValue(true),
        dispose: vi.fn(),
      };
      const check2: HealthCheck = {
        name: "check2",
        check: vi.fn().mockReturnValue(false),
        dispose: vi.fn(),
      };

      registry.register(check1);
      registry.register(check2);

      const results = registry.runAll();

      expect(results.get("check1")).toBe(true);
      expect(results.get("check2")).toBe(false);
      expect(check1.check).toHaveBeenCalled();
      expect(check2.check).toHaveBeenCalled();
    });

    it("should return empty Map when no checks registered", () => {
      const results = registry.runAll();
      expect(results.size).toBe(0);
    });
  });

  describe("getCheck", () => {
    it("should return undefined for non-existent check", () => {
      expect(registry.getCheck("nonexistent")).toBeUndefined();
    });
  });

  describe("getAllChecks", () => {
    it("should return all registered checks", () => {
      const check1: HealthCheck = {
        name: "check1",
        check: vi.fn().mockReturnValue(true),
        dispose: vi.fn(),
      };
      const check2: HealthCheck = {
        name: "check2",
        check: vi.fn().mockReturnValue(true),
        dispose: vi.fn(),
      };

      registry.register(check1);
      registry.register(check2);

      const checks = registry.getAllChecks();

      expect(checks).toContain(check1);
      expect(checks).toContain(check2);
      expect(checks).toHaveLength(2);
    });

    it("should return empty array when no checks registered", () => {
      const checks = registry.getAllChecks();
      expect(checks).toHaveLength(0);
    });
  });

  describe("dispose", () => {
    it("should call dispose on all registered checks", () => {
      const check1: HealthCheck = {
        name: "check1",
        check: vi.fn().mockReturnValue(true),
        dispose: vi.fn(),
      };
      const check2: HealthCheck = {
        name: "check2",
        check: vi.fn().mockReturnValue(true),
        dispose: vi.fn(),
      };

      registry.register(check1);
      registry.register(check2);

      registry.dispose();

      expect(check1.dispose).toHaveBeenCalled();
      expect(check2.dispose).toHaveBeenCalled();
    });

    it("should clear all checks after dispose", () => {
      const check: HealthCheck = {
        name: "test",
        check: vi.fn().mockReturnValue(true),
        dispose: vi.fn(),
      };

      registry.register(check);
      registry.dispose();

      expect(registry.getAllChecks()).toHaveLength(0);
    });
  });

  describe("Dependencies", () => {
    it("should have no dependencies", () => {
      expect(HealthCheckRegistry.dependencies).toHaveLength(0);
    });

    it("wrapper should mirror empty dependencies", () => {
      expect(DIHealthCheckRegistry.dependencies).toHaveLength(0);
    });
  });

  describe("DIHealthCheckRegistry", () => {
    it("should instantiate correctly", () => {
      const diRegistry = new DIHealthCheckRegistry();
      expect(diRegistry).toBeInstanceOf(HealthCheckRegistry);
      expect(diRegistry).toBeInstanceOf(DIHealthCheckRegistry);
    });

    it("should work like HealthCheckRegistry", () => {
      const diRegistry = new DIHealthCheckRegistry();
      const check: HealthCheck = {
        name: "test",
        check: vi.fn().mockReturnValue(true),
        dispose: vi.fn(),
      };

      diRegistry.register(check);
      expect(diRegistry.getCheck("test")).toBe(check);
    });
  });
});
