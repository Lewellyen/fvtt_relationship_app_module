import { describe, it, expect, beforeEach } from "vitest";
import { ContainerHealthCheck } from "@/application/health/ContainerHealthCheck";
import { ServiceContainer } from "@/infrastructure/di/container";
import { createInjectionToken } from "@/infrastructure/di/tokenutilities";
import { createDummyService } from "@/test/utils/test-helpers";

describe("ContainerHealthCheck", () => {
  let container: ServiceContainer;
  let check: ContainerHealthCheck;

  beforeEach(() => {
    container = ServiceContainer.createRoot();
    check = new ContainerHealthCheck(container);
  });

  describe("name", () => {
    it('should have name "container"', () => {
      expect(check.name).toBe("container");
    });
  });

  describe("check", () => {
    it("should return true when container is validated", () => {
      const token = createInjectionToken("test");
      container.registerValue(token, createDummyService());
      container.validate();

      expect(check.check()).toBe(true);
    });

    it("should return false when container is not validated", () => {
      // Don't validate container
      expect(check.check()).toBe(false);
    });
  });

  describe("getDetails", () => {
    it("should return null when container is validated", () => {
      const token = createInjectionToken("test");
      container.registerValue(token, createDummyService());
      container.validate();

      expect(check.getDetails()).toBeNull();
    });

    it("should return error message when container is not validated", () => {
      const details = check.getDetails();
      expect(details).toContain("Container state:");
      expect(details).not.toBe("validated");
    });
  });

  describe("dispose", () => {
    it("should be callable without throwing", () => {
      expect(() => check.dispose()).not.toThrow();
    });
  });
});
