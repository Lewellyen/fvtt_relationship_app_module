import { describe, it, expect, beforeEach, vi } from "vitest";
import { LogLevel } from "../environment";

describe("Environment Configuration", () => {
  beforeEach(() => {
    // Reset environment mocks
    vi.resetModules();
  });

  describe("LogLevel Enum", () => {
    it("should have correct numeric values", () => {
      expect(LogLevel.DEBUG).toBe(0);
      expect(LogLevel.INFO).toBe(1);
      expect(LogLevel.WARN).toBe(2);
      expect(LogLevel.ERROR).toBe(3);
    });

    it("should allow level comparison", () => {
      expect(LogLevel.DEBUG < LogLevel.INFO).toBe(true);
      expect(LogLevel.INFO < LogLevel.WARN).toBe(true);
      expect(LogLevel.WARN < LogLevel.ERROR).toBe(true);
      expect(LogLevel.ERROR > LogLevel.DEBUG).toBe(true);
    });
  });

  describe("ENV Configuration", () => {
    it("should have all required properties", async () => {
      const { ENV } = await import("../environment");

      expect(ENV).toHaveProperty("isDevelopment");
      expect(ENV).toHaveProperty("isProduction");
      expect(ENV).toHaveProperty("logLevel");
      expect(ENV).toHaveProperty("enablePerformanceTracking");
      expect(ENV).toHaveProperty("enableDebugMode");
    });

    it("should have valid logLevel", async () => {
      const { ENV, LogLevel: logLevelEnum } = await import("../environment");

      expect(Object.values(logLevelEnum)).toContain(ENV.logLevel);
    });

    it("should have boolean flags", async () => {
      const { ENV } = await import("../environment");

      expect(typeof ENV.isDevelopment).toBe("boolean");
      expect(typeof ENV.isProduction).toBe("boolean");
      expect(typeof ENV.enablePerformanceTracking).toBe("boolean");
      expect(typeof ENV.enableDebugMode).toBe("boolean");
    });

    it("should not be both development and production", async () => {
      const { ENV } = await import("../environment");

      // Either one or the other, not both
      if (ENV.isDevelopment) {
        expect(ENV.isProduction).toBe(false);
      }
      if (ENV.isProduction) {
        expect(ENV.isDevelopment).toBe(false);
      }
    });
  });
});
