import { describe, it, expect, vi, afterEach } from "vitest";
import { sanitizeErrorForProduction, sanitizeMessageForProduction } from "../error-sanitizer";
import type { ContainerError } from "@/di_infrastructure/interfaces/containererror";

describe("Error Sanitizer", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("sanitizeErrorForProduction", () => {
    it("should return full error in development mode", async () => {
      const envModule = await import("@/config/environment");
      vi.spyOn(envModule, "ENV", "get").mockReturnValue({
        isDevelopment: true,
        isProduction: false,
        logLevel: 0,
        enablePerformanceTracking: false,
        enableDebugMode: true,
      });

      const error: ContainerError = {
        code: "TokenNotRegistered",
        message: "Service not found: UserService",
        tokenDescription: "Symbol(UserService)",
        cause: new Error("Root cause"),
      };

      const sanitized = sanitizeErrorForProduction(error);

      expect(sanitized).toEqual(error);
      expect(sanitized.tokenDescription).toBe("Symbol(UserService)");
      expect(sanitized.cause).toBeInstanceOf(Error);
    });

    it("should strip sensitive info in production mode", async () => {
      const envModule = await import("@/config/environment");
      vi.spyOn(envModule, "ENV", "get").mockReturnValue({
        isDevelopment: false,
        isProduction: true,
        logLevel: 1,
        enablePerformanceTracking: false,
        enableDebugMode: false,
      });

      const error: ContainerError = {
        code: "TokenNotRegistered",
        message: "Service not found: UserService",
        tokenDescription: "Symbol(UserService)",
        cause: new Error("Root cause"),
      };

      const sanitized = sanitizeErrorForProduction(error);

      expect(sanitized.code).toBe("TokenNotRegistered");
      expect(sanitized.message).toBe(
        "An internal error occurred. Please contact support if this persists."
      );
      expect(sanitized.tokenDescription).toBeUndefined();
      expect(sanitized.cause).toBeUndefined();
    });

    it("should preserve error code in production", async () => {
      const envModule = await import("@/config/environment");
      vi.spyOn(envModule, "ENV", "get").mockReturnValue({
        isDevelopment: false,
        isProduction: true,
        logLevel: 1,
        enablePerformanceTracking: false,
        enableDebugMode: false,
      });

      const error: ContainerError = {
        code: "CircularDependency",
        message: "A depends on B depends on A",
      };

      const sanitized = sanitizeErrorForProduction(error);

      expect(sanitized.code).toBe("CircularDependency");
    });
  });

  describe("sanitizeMessageForProduction", () => {
    it("should return full message in development", async () => {
      const envModule = await import("@/config/environment");
      vi.spyOn(envModule, "ENV", "get").mockReturnValue({
        isDevelopment: true,
        isProduction: false,
        logLevel: 0,
        enablePerformanceTracking: false,
        enableDebugMode: true,
      });

      const message = "Detailed error: Failed to connect to database at localhost:5432";
      const sanitized = sanitizeMessageForProduction(message);

      expect(sanitized).toBe(message);
    });

    it("should return generic message in production", async () => {
      const envModule = await import("@/config/environment");
      vi.spyOn(envModule, "ENV", "get").mockReturnValue({
        isDevelopment: false,
        isProduction: true,
        logLevel: 1,
        enablePerformanceTracking: false,
        enableDebugMode: false,
      });

      const message = "Sensitive internal error with stack trace...";
      const sanitized = sanitizeMessageForProduction(message);

      expect(sanitized).toBe("An error occurred");
    });
  });
});

