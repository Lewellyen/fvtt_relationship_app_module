import { describe, it, expect } from "vitest";
import { createInjectionToken } from "@/infrastructure/di/tokenutilities";
import { markAsApiSafe, isApiSafeTokenRuntime } from "@/infrastructure/di/types";
import { ServiceContainer } from "@/infrastructure/di/container";
import { ServiceLifecycle } from "@/infrastructure/di/types/core/servicelifecycle";

describe("ApiSafeToken", () => {
  describe("markAsApiSafe", () => {
    it("should mark token with runtime marker", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const token = createInjectionToken<any>("TestToken");
      const apiToken = markAsApiSafe(token);

      // Verify token is in WeakSet registry
      expect(isApiSafeTokenRuntime(apiToken)).toBe(true);
    });

    it("should preserve token identity", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const token = createInjectionToken<any>("TestToken");
      const apiToken = markAsApiSafe(token);

      // Same token object, just branded
      expect(apiToken).toBe(token);
    });

    it("should allow marking same token multiple times", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const token = createInjectionToken<any>("TestToken");
      const apiToken1 = markAsApiSafe(token);
      const apiToken2 = markAsApiSafe(token);

      expect(apiToken1).toBe(apiToken2);
      expect(isApiSafeTokenRuntime(apiToken1)).toBe(true);
      expect(isApiSafeTokenRuntime(apiToken2)).toBe(true);
    });
  });

  describe("isApiSafeTokenRuntime", () => {
    it("should validate API-safe tokens at runtime", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const token = createInjectionToken<any>("TestToken");
      const apiToken = markAsApiSafe(token);

      expect(isApiSafeTokenRuntime(apiToken)).toBe(true);
      expect(isApiSafeTokenRuntime(token)).toBe(true); // Same object after mark
    });

    it("should reject non-API-safe tokens at runtime", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const token = createInjectionToken<any>("TestToken");

      expect(isApiSafeTokenRuntime(token)).toBe(false);
    });
  });

  describe("Container API Boundary Enforcement", () => {
    it("container.resolve() should reject non-API-safe tokens", () => {
      const container = ServiceContainer.createRoot();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const token = createInjectionToken<any>("TestToken");

      container.registerValue(token, "test-value");
      container.validate();

      // ❌ Runtime error: token not marked as API-safe
      expect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        container.resolve(token as any);
      }).toThrow(/API Boundary Violation/);
    });

    it("container.resolve() should accept API-safe tokens", () => {
      const container = ServiceContainer.createRoot();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const token = createInjectionToken<any>("TestToken");
      const apiToken = markAsApiSafe(token);

      container.registerValue(token, "test-value");
      container.validate();

      // ✅ Works with API-safe token
      const value = container.resolve(apiToken);
      expect(value).toBe("test-value");
    });

    it("container.resolveWithError() should accept any token", () => {
      const container = ServiceContainer.createRoot();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const token = createInjectionToken<any>("TestToken");

      container.registerValue(token, "test-value");
      container.validate();

      // ✅ Works with regular token
      const result = container.resolveWithError(token);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe("test-value");
      }
    });

    it("container.resolveWithError() should also accept API-safe tokens", () => {
      const container = ServiceContainer.createRoot();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const token = createInjectionToken<any>("TestToken");
      const apiToken = markAsApiSafe(token);

      container.registerValue(token, "test-value");
      container.validate();

      // ✅ Works with API-safe token too
      const result = container.resolveWithError(apiToken);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe("test-value");
      }
    });

    it("should provide helpful error message for non-API-safe tokens", () => {
      const container = ServiceContainer.createRoot();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const token = createInjectionToken<any>("MyService");

      container.registerValue(token, "test-value");
      container.validate();

      expect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        container.resolve(token as any);
      }).toThrow(/API Boundary Violation/);

      expect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        container.resolve(token as any);
      }).toThrow(/markAsApiSafe/);
    });

    it("should work with classes that have dependencies", () => {
      const container = ServiceContainer.createRoot();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const depToken = createInjectionToken<any>("Dependency");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const serviceToken = createInjectionToken<any>("Service");

      class Dependency {
        value = "dependency";
      }

      class Service {
        static dependencies = [depToken] as const;
        constructor(public dep: Dependency) {}
      }

      container.registerClass(depToken, Dependency, ServiceLifecycle.SINGLETON);
      container.registerClass(serviceToken, Service, ServiceLifecycle.SINGLETON);
      container.validate();

      // Mark only the service token as API-safe
      const apiToken = markAsApiSafe(serviceToken);

      // Should resolve with dependency
      const service = container.resolve(apiToken);
      expect(service.dep.value).toBe("dependency");
    });

    it("should prevent type assertion bypass at runtime", () => {
      const container = ServiceContainer.createRoot();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const token = createInjectionToken<any>("TestToken");

      container.registerValue(token, "test-value");
      container.validate();

      // Even with type assertion, runtime guard should catch it
      expect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        container.resolve(token as any);
      }).toThrow(/API Boundary Violation/);
    });
  });

  describe("External API Usage Simulation", () => {
    it("should simulate external module using api.resolve()", () => {
      const container = ServiceContainer.createRoot();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const token = createInjectionToken<any>("NotificationCenter");
      const apiToken = markAsApiSafe(token);

      const notifications = {
        error: (message: string) => message,
      };

      container.registerValue(token, notifications);
      container.validate();

      const mockApi = {
        tokens: { notificationCenterToken: apiToken },
        resolve: container.resolve.bind(container), // eslint-disable-line @typescript-eslint/no-deprecated
      };

      const resolvedNotifications = mockApi.resolve(mockApi.tokens.notificationCenterToken);
      expect(resolvedNotifications.error("test")).toBe("test");
    });

    it("should simulate external module using api.resolveWithError()", () => {
      const container = ServiceContainer.createRoot();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const token = createInjectionToken<any>("NotificationCenter");
      const apiToken = markAsApiSafe(token);

      const notifications = {
        error: (message: string) => message,
      };

      container.registerValue(token, notifications);
      container.validate();

      const mockApi = {
        tokens: { notificationCenterToken: apiToken },
        resolveWithError: container.resolveWithError.bind(container),
      };

      const result = mockApi.resolveWithError(mockApi.tokens.notificationCenterToken);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.error("test")).toBe("test");
      }
    });
  });
});
