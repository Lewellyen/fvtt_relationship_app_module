import { describe, it, expect, vi, beforeEach } from "vitest";
import { HealthCheckRegistryAdapter } from "../health-check-registry-adapter";
import type { HealthCheck } from "@/domain/types/health-check";

describe("HealthCheckRegistryAdapter", () => {
  let adapter: HealthCheckRegistryAdapter;

  beforeEach(() => {
    adapter = new HealthCheckRegistryAdapter();
  });

  describe("register", () => {
    it("should register a health check", () => {
      const check: HealthCheck = {
        name: "test",
        check: vi.fn().mockReturnValue(true),
        dispose: vi.fn(),
      };

      adapter.register(check);

      expect(adapter.getCheck("test")).toBe(check);
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

      adapter.register(check1);
      adapter.register(check2);

      expect(adapter.getAllChecks()).toHaveLength(2);
    });
  });

  describe("unregister", () => {
    it("should remove a health check", () => {
      const check: HealthCheck = {
        name: "test",
        check: vi.fn().mockReturnValue(true),
        dispose: vi.fn(),
      };

      adapter.register(check);
      adapter.unregister("test");

      expect(adapter.getCheck("test")).toBeUndefined();
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

      adapter.register(check1);
      adapter.register(check2);

      const results = adapter.runAll();

      expect(results.get("check1")).toBe(true);
      expect(results.get("check2")).toBe(false);
      expect(check1.check).toHaveBeenCalled();
      expect(check2.check).toHaveBeenCalled();
    });

    it("should return empty Map when no checks registered", () => {
      const results = adapter.runAll();
      expect(results.size).toBe(0);
    });
  });

  describe("getCheck", () => {
    it("should return undefined for non-existent check", () => {
      expect(adapter.getCheck("nonexistent")).toBeUndefined();
    });

    it("should return registered check", () => {
      const check: HealthCheck = {
        name: "test",
        check: vi.fn().mockReturnValue(true),
        dispose: vi.fn(),
      };

      adapter.register(check);

      expect(adapter.getCheck("test")).toBe(check);
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

      adapter.register(check1);
      adapter.register(check2);

      const checks = adapter.getAllChecks();

      expect(checks).toContain(check1);
      expect(checks).toContain(check2);
      expect(checks).toHaveLength(2);
    });

    it("should return empty array when no checks registered", () => {
      const checks = adapter.getAllChecks();
      expect(checks).toHaveLength(0);
    });
  });
});
