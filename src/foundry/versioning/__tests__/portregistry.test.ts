import { describe, it, expect } from "vitest";
import { PortRegistry } from "../portregistry";
import { expectResultOk, expectResultErr } from "@/test/utils/test-helpers";

describe("PortRegistry", () => {
  describe("register", () => {
    it("should register port factory", () => {
      const registry = new PortRegistry<string>();
      const factory = () => "port-instance";

      const result = registry.register(13, factory);
      expectResultOk(result);
    });

    it("should reject duplicate version registration", () => {
      const registry = new PortRegistry<string>();
      const factory1 = () => "port-1";
      const factory2 = () => "port-2";

      registry.register(13, factory1);
      const result = registry.register(13, factory2);

      expectResultErr(result);
      expect(result.error).toContain("already registered");
    });
  });

  describe("getAvailableVersions", () => {
    it("should return sorted versions", () => {
      const registry = new PortRegistry<string>();

      registry.register(15, () => "port-15");
      registry.register(13, () => "port-13");
      registry.register(14, () => "port-14");

      const versions = registry.getAvailableVersions();
      expect(versions).toEqual([13, 14, 15]);
    });

    it("should return empty array when no ports registered", () => {
      const registry = new PortRegistry<string>();
      const versions = registry.getAvailableVersions();
      expect(versions).toEqual([]);
    });
  });

  describe("createAll", () => {
    it("should create all registered ports", () => {
      const registry = new PortRegistry<string>();

      registry.register(13, () => "port-13");
      registry.register(14, () => "port-14");

      const ports = registry.createAll();
      expect(ports.size).toBe(2);
      expect(ports.get(13)).toBe("port-13");
      expect(ports.get(14)).toBe("port-14");
    });

    it("should call factory functions", () => {
      const registry = new PortRegistry<{ value: number }>();
      let callCount = 0;

      registry.register(13, () => {
        callCount++;
        return { value: 42 };
      });

      registry.createAll();
      expect(callCount).toBe(1);
    });
  });

  describe("createForVersion", () => {
    it("should create port for exact version match", () => {
      const registry = new PortRegistry<string>();

      registry.register(13, () => "port-13");
      registry.register(14, () => "port-14");

      const result = registry.createForVersion(13);
      expectResultOk(result);
      expect(result.value).toBe("port-13");
    });

    it("should select highest compatible version", () => {
      const registry = new PortRegistry<string>();

      registry.register(13, () => "port-13");
      registry.register(14, () => "port-14");

      const result = registry.createForVersion(15);
      expectResultOk(result);
      expect(result.value).toBe("port-14");
    });

    it("should fail when no compatible version", () => {
      const registry = new PortRegistry<string>();

      registry.register(14, () => "port-14");
      registry.register(15, () => "port-15");

      const result = registry.createForVersion(13);
      expectResultErr(result);
      expect(result.error).toContain("No compatible port");
      expect(result.error).toContain("13");
    });

    it("should handle empty registry", () => {
      const registry = new PortRegistry<string>();

      const result = registry.createForVersion(13);
      expectResultErr(result);
      expect(result.error).toContain("none");
    });
  });

  describe("hasVersion", () => {
    it("should return true for registered version", () => {
      const registry = new PortRegistry<string>();
      registry.register(13, () => "port-13");

      expect(registry.hasVersion(13)).toBe(true);
    });

    it("should return false for unregistered version", () => {
      const registry = new PortRegistry<string>();
      registry.register(13, () => "port-13");

      expect(registry.hasVersion(14)).toBe(false);
    });
  });

  describe("getHighestVersion", () => {
    it("should return highest registered version", () => {
      const registry = new PortRegistry<string>();

      registry.register(13, () => "port-13");
      registry.register(15, () => "port-15");
      registry.register(14, () => "port-14");

      expect(registry.getHighestVersion()).toBe(15);
    });

    it("should return undefined when no ports registered", () => {
      const registry = new PortRegistry<string>();
      expect(registry.getHighestVersion()).toBeUndefined();
    });
  });
});
