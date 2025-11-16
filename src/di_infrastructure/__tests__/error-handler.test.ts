/**
 * Tests for ContainerErrorHandler
 */

import { describe, it, expect } from "vitest";
import { ContainerErrorHandler } from "../error-handler";
import type { ContainerError } from "../interfaces/containererror";
import { LogLevel } from "@/config/environment";
import { createMockRuntimeConfig } from "@/test/utils/test-helpers";

describe("ContainerErrorHandler", () => {
  describe("sanitize", () => {
    it("should return full error in development mode", () => {
      const config = createMockRuntimeConfig({
        logLevel: LogLevel.DEBUG,
        enablePerformanceTracking: true,
      });

      const handler = new ContainerErrorHandler(config);
      const error: ContainerError = {
        code: "TokenNotRegistered",
        message: "Service not registered",
        tokenDescription: "MyService",
      };

      const sanitized = handler.sanitize(error);

      expect(sanitized).toBe(error); // Same object in development
      expect(sanitized.tokenDescription).toBe("MyService");
    });

    it("should sanitize error in production mode", () => {
      const config = createMockRuntimeConfig({
        isDevelopment: false,
        isProduction: true,
        logLevel: LogLevel.ERROR,
        enablePerformanceTracking: false,
        performanceSamplingRate: 0.1,
      });

      const handler = new ContainerErrorHandler(config);
      const error: ContainerError = {
        code: "TokenNotRegistered",
        message: "Service not registered",
        tokenDescription: "MyService",
      };

      const sanitized = handler.sanitize(error);

      expect(sanitized.code).toBe("TokenNotRegistered");
      expect(sanitized.message).toBe(
        "An internal error occurred. Please contact support if this persists."
      );
      expect(sanitized.tokenDescription).toBeUndefined(); // Removed in production
    });
  });

  describe("handle", () => {
    it("should handle error with sanitization", () => {
      const config = createMockRuntimeConfig({
        isDevelopment: false,
        isProduction: true,
        logLevel: LogLevel.ERROR,
        enablePerformanceTracking: false,
        performanceSamplingRate: 0.1,
      });

      const handler = new ContainerErrorHandler(config);
      const error: ContainerError = {
        code: "CircularDependency",
        message: "Circular dependency detected",
        tokenDescription: "ServiceA -> ServiceB -> ServiceA",
      };

      const handled = handler.handle(error);

      expect(handled.code).toBe("CircularDependency");
      expect(handled.message).toBe(
        "An internal error occurred. Please contact support if this persists."
      );
      expect(handled.tokenDescription).toBeUndefined();
    });

    it("should preserve error in development", () => {
      const config = createMockRuntimeConfig({
        logLevel: LogLevel.DEBUG,
        enablePerformanceTracking: true,
      });

      const handler = new ContainerErrorHandler(config);
      const error: ContainerError = {
        code: "CircularDependency",
        message: "Circular dependency detected",
        tokenDescription: "ServiceA -> ServiceB -> ServiceA",
      };

      const handled = handler.handle(error);

      expect(handled).toBe(error);
      expect(handled.tokenDescription).toBe("ServiceA -> ServiceB -> ServiceA");
    });
  });
});
