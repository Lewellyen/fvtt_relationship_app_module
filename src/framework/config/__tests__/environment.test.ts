import { describe, it, expect, beforeEach, vi } from "vitest";
import { parseSamplingRate } from "@/framework/config/environment";
import { LogLevel } from "@/domain/types/log-level";

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
      const { ENV } = await import("@/framework/config/environment");

      expect(ENV).toHaveProperty("isDevelopment");
      expect(ENV).toHaveProperty("isProduction");
      expect(ENV).toHaveProperty("logLevel");
      expect(ENV).toHaveProperty("enablePerformanceTracking");
      expect(ENV).toHaveProperty("enableMetricsPersistence");
      expect(ENV).toHaveProperty("metricsPersistenceKey");
    });

    it("should have valid logLevel", async () => {
      const { ENV } = await import("@/framework/config/environment");
      const { LogLevel: logLevelEnum } = await import("@/domain/types/log-level");

      expect(Object.values(logLevelEnum)).toContain(ENV.logLevel);
    });

    it("should have boolean flags", async () => {
      const { ENV } = await import("@/framework/config/environment");

      expect(typeof ENV.isDevelopment).toBe("boolean");
      expect(typeof ENV.isProduction).toBe("boolean");
      expect(typeof ENV.enablePerformanceTracking).toBe("boolean");
      expect(typeof ENV.enableMetricsPersistence).toBe("boolean");
      expect(typeof ENV.metricsPersistenceKey).toBe("string");
    });

    it("should not be both development and production", async () => {
      const { ENV } = await import("@/framework/config/environment");

      // Either one or the other, not both
      if (ENV.isDevelopment) {
        expect(ENV.isProduction).toBe(false);
      }
      if (ENV.isProduction) {
        expect(ENV.isDevelopment).toBe(false);
      }
    });
  });

  describe("parseSamplingRate", () => {
    it("should parse valid sampling rate", () => {
      expect(parseSamplingRate("0.5", 0.01)).toBe(0.5);
      expect(parseSamplingRate("0.01", 0.01)).toBe(0.01);
      expect(parseSamplingRate("1.0", 0.01)).toBe(1.0);
      expect(parseSamplingRate("0", 0.01)).toBe(0);
    });

    it("should clamp values above 1.0", () => {
      expect(parseSamplingRate("1.5", 0.01)).toBe(1.0);
      expect(parseSamplingRate("2.0", 0.01)).toBe(1.0);
      expect(parseSamplingRate("100", 0.01)).toBe(1.0);
    });

    it("should clamp negative values to 0", () => {
      expect(parseSamplingRate("-0.5", 0.01)).toBe(0);
      expect(parseSamplingRate("-1.0", 0.01)).toBe(0);
      expect(parseSamplingRate("-100", 0.01)).toBe(0);
    });

    it("should return fallback for NaN", () => {
      expect(parseSamplingRate("invalid", 0.01)).toBe(0.01);
      expect(parseSamplingRate("abc", 0.5)).toBe(0.5);
      expect(parseSamplingRate("", 0.75)).toBe(0.75);
    });

    it("should return fallback for undefined", () => {
      expect(parseSamplingRate(undefined, 0.01)).toBe(0.01);
      expect(parseSamplingRate(undefined, 0.5)).toBe(0.5);
    });

    it("should return fallback for Infinity", () => {
      expect(parseSamplingRate("Infinity", 0.01)).toBe(0.01);
      expect(parseSamplingRate("-Infinity", 0.01)).toBe(0.01);
    });

    it("should handle edge case values", () => {
      expect(parseSamplingRate("0.0", 0.01)).toBe(0);
      expect(parseSamplingRate("1.0", 0.01)).toBe(1.0);
      expect(parseSamplingRate("0.999999", 0.01)).toBeCloseTo(0.999999);
    });

    it("should handle scientific notation", () => {
      expect(parseSamplingRate("1e-2", 0.01)).toBe(0.01);
      expect(parseSamplingRate("5e-1", 0.01)).toBe(0.5);
    });
  });
});
