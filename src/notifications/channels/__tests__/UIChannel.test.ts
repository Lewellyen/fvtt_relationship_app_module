import { describe, it, expect, vi, beforeEach } from "vitest";
import { UIChannel } from "../UIChannel";
import type { FoundryUI } from "@/foundry/interfaces/FoundryUI";
import type { EnvironmentConfig } from "@/config/environment";
import type { Notification } from "@/notifications/notification-channel.interface";
import { LogLevel } from "@/config/environment";
import { ok, err } from "@/utils/functional/result";

describe("UIChannel", () => {
  let channel: UIChannel;
  let mockFoundryUI: FoundryUI;
  let devEnv: EnvironmentConfig;
  let prodEnv: EnvironmentConfig;

  beforeEach(() => {
    mockFoundryUI = {
      notify: vi.fn().mockReturnValue(ok(undefined)),
      removeJournalElement: vi.fn(),
      findElement: vi.fn(),
      dispose: vi.fn(),
    } as unknown as FoundryUI;

    devEnv = {
      isDevelopment: true,
      isProduction: false,
      logLevel: LogLevel.DEBUG,
      enablePerformanceTracking: false,
      enableDebugMode: true,
      performanceSamplingRate: 1.0,
    };

    prodEnv = {
      isDevelopment: false,
      isProduction: true,
      logLevel: LogLevel.INFO,
      enablePerformanceTracking: false,
      enableDebugMode: false,
      performanceSamplingRate: 0.01,
    };
  });

  describe("canHandle", () => {
    it("should NOT handle debug notifications", () => {
      channel = new UIChannel(mockFoundryUI, devEnv);

      const notification: Notification = {
        level: "debug",
        context: "Debug message",
        timestamp: new Date(),
      };

      expect(channel.canHandle(notification)).toBe(false);
    });

    it("should handle info notifications", () => {
      channel = new UIChannel(mockFoundryUI, devEnv);

      const notification: Notification = {
        level: "info",
        context: "Info message",
        timestamp: new Date(),
      };

      expect(channel.canHandle(notification)).toBe(true);
    });

    it("should handle warn notifications", () => {
      channel = new UIChannel(mockFoundryUI, devEnv);

      const notification: Notification = {
        level: "warn",
        context: "Warning",
        timestamp: new Date(),
      };

      expect(channel.canHandle(notification)).toBe(true);
    });

    it("should handle error notifications", () => {
      channel = new UIChannel(mockFoundryUI, devEnv);

      const notification: Notification = {
        level: "error",
        context: "Error",
        timestamp: new Date(),
      };

      expect(channel.canHandle(notification)).toBe(true);
    });
  });

  describe("send - Development Mode", () => {
    beforeEach(() => {
      channel = new UIChannel(mockFoundryUI, devEnv);
    });

    it("should show error details in development", () => {
      const error = { code: "OPERATION_FAILED", message: "Database connection lost" };
      const notification: Notification = {
        level: "error",
        context: "Failed to save",
        error,
        timestamp: new Date(),
      };

      channel.send(notification);

      expect(mockFoundryUI.notify).toHaveBeenCalledWith(
        "Failed to save: Database connection lost",
        "error",
        undefined
      );
    });

    it("should show data.message in development for non-error levels", () => {
      const notification: Notification = {
        level: "info",
        context: "Processing",
        data: { message: "User action completed", details: "..." },
        timestamp: new Date(),
      };

      channel.send(notification);

      expect(mockFoundryUI.notify).toHaveBeenCalledWith(
        "Processing: User action completed",
        "info",
        undefined
      );
    });

    it("should show context only if no message in data", () => {
      const notification: Notification = {
        level: "info",
        context: "Operation completed successfully",
        data: { count: 10 },
        timestamp: new Date(),
      };

      channel.send(notification);

      expect(mockFoundryUI.notify).toHaveBeenCalledWith(
        "Operation completed successfully",
        "info",
        undefined
      );
    });

    it("should forward uiOptions to Foundry UI", () => {
      const uiOptions = { permanent: true, duration: 0 };
      const notification: Notification = {
        level: "info",
        context: "Persistent message",
        timestamp: new Date(),
        uiOptions,
      };

      channel.send(notification);

      expect(mockFoundryUI.notify).toHaveBeenCalledWith("Persistent message", "info", uiOptions);
    });

    it("should show warnings as-is in development", () => {
      const notification: Notification = {
        level: "warn",
        context: "Deprecated API used",
        timestamp: new Date(),
      };

      channel.send(notification);

      expect(mockFoundryUI.notify).toHaveBeenCalledWith(
        "Deprecated API used",
        "warning",
        undefined
      );
    });

    it("should gracefully handle debug level when forced", () => {
      const notification: Notification = {
        level: "debug",
        context: "Debug context",
        timestamp: new Date(),
      };

      channel.send(notification);

      expect(mockFoundryUI.notify).toHaveBeenCalledWith("Debug context", "info", undefined);
    });
  });

  describe("send - Production Mode", () => {
    beforeEach(() => {
      channel = new UIChannel(mockFoundryUI, prodEnv);
    });

    it("should sanitize error messages in production", () => {
      const error = {
        code: "DATABASE_ERROR",
        message: "Connection to postgres://localhost:5432/secret failed",
        details: { apiKey: "secret123" },
      };
      const notification: Notification = {
        level: "error",
        context: "Failed to save data",
        error,
        timestamp: new Date(),
      };

      channel.send(notification);

      // Should show generic message with error code
      expect(mockFoundryUI.notify).toHaveBeenCalledWith(
        "Failed to save data. Please try again or contact support. (Error: DATABASE_ERROR)",
        "error",
        undefined
      );
      // Should NOT contain sensitive details
      expect(mockFoundryUI.notify).not.toHaveBeenCalledWith(
        expect.stringContaining("postgres://"),
        expect.anything(),
        expect.anything()
      );
      expect(mockFoundryUI.notify).not.toHaveBeenCalledWith(
        expect.stringContaining("secret123"),
        expect.anything(),
        expect.anything()
      );
    });

    it("should show info/warn messages as-is in production", () => {
      const infoNotification: Notification = {
        level: "info",
        context: "Save completed",
        timestamp: new Date(),
      };

      channel.send(infoNotification);

      // Info/Warn messages are assumed to be already user-friendly
      expect(mockFoundryUI.notify).toHaveBeenCalledWith("Save completed", "info", undefined);
    });
  });

  describe("send - UI notification failures", () => {
    it("should return error if UI notification fails", () => {
      channel = new UIChannel(mockFoundryUI, devEnv);
      vi.mocked(mockFoundryUI.notify).mockReturnValue(
        err({ code: "API_NOT_AVAILABLE", message: "UI not ready" })
      );

      const notification: Notification = {
        level: "info",
        context: "Test",
        timestamp: new Date(),
      };

      const result = channel.send(notification);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("UI notification failed");
      }
    });
  });

  describe("Level mapping", () => {
    beforeEach(() => {
      channel = new UIChannel(mockFoundryUI, devEnv);
    });

    it("should map info to info UI type", () => {
      const notification: Notification = {
        level: "info",
        context: "Info",
        timestamp: new Date(),
      };

      channel.send(notification);

      expect(mockFoundryUI.notify).toHaveBeenCalledWith(expect.anything(), "info", undefined);
    });

    it("should map warn to warning UI type", () => {
      const notification: Notification = {
        level: "warn",
        context: "Warning",
        timestamp: new Date(),
      };

      channel.send(notification);

      expect(mockFoundryUI.notify).toHaveBeenCalledWith(expect.anything(), "warning", undefined);
    });

    it("should map error to error UI type", () => {
      const notification: Notification = {
        level: "error",
        context: "Error",
        error: { code: "TEST", message: "Test" },
        timestamp: new Date(),
      };

      channel.send(notification);

      expect(mockFoundryUI.notify).toHaveBeenCalledWith(expect.anything(), "error", undefined);
    });
  });

  describe("name", () => {
    it("should have correct channel name", () => {
      channel = new UIChannel(mockFoundryUI, devEnv);
      expect(channel.name).toBe("UIChannel");
    });
  });
});
