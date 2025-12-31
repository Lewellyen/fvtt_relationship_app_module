import { describe, it, expect, vi, beforeEach } from "vitest";
import { RuntimeConfigLoggerDecorator } from "../RuntimeConfigLoggerDecorator";
import { BaseConsoleLogger } from "../BaseConsoleLogger";
import { LogLevel } from "@/domain/types/log-level";
import type { PlatformRuntimeConfigPort } from "@/domain/ports/platform-runtime-config-port.interface";
import { RuntimeConfigAdapter } from "@/infrastructure/config/runtime-config-adapter";
import { createMockEnvironmentConfig } from "@/test/utils/test-helpers";
import type { Logger } from "../logger.interface";

describe("RuntimeConfigLoggerDecorator", () => {
  let mockConfig: PlatformRuntimeConfigPort;
  let baseLogger: BaseConsoleLogger;

  beforeEach(() => {
    mockConfig = new RuntimeConfigAdapter(createMockEnvironmentConfig({ logLevel: LogLevel.INFO }));
    baseLogger = new BaseConsoleLogger(LogLevel.INFO);
  });

  describe("dispose", () => {
    it("should unsubscribe from RuntimeConfig when disposed", () => {
      const unsubscribeSpy = vi.fn();
      const onChangeSpy = vi.spyOn(mockConfig, "onChange").mockReturnValue(unsubscribeSpy);

      // Create a new decorator to trigger onChange subscription
      const newDecorator = new RuntimeConfigLoggerDecorator(baseLogger, mockConfig);

      // Dispose should call unsubscribe
      newDecorator.dispose();

      expect(unsubscribeSpy).toHaveBeenCalledTimes(1);
      onChangeSpy.mockRestore();
    });

    it("should handle dispose when unsubscribe is null", () => {
      const decorator = new RuntimeConfigLoggerDecorator(baseLogger, mockConfig);

      // Should not throw when unsubscribe is null
      expect(() => decorator.dispose()).not.toThrow();
    });
  });

  describe("withTraceId", () => {
    it("should return base logger if withTraceId is not available", () => {
      // Create a mock logger without withTraceId
      const mockLogger: Logger = {
        log: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        info: vi.fn(),
        debug: vi.fn(),
        setMinLevel: vi.fn(),
        // withTraceId is intentionally missing
      };

      const decorator = new RuntimeConfigLoggerDecorator(mockLogger, mockConfig);
      const result = decorator.withTraceId("test-trace");

      // Should return the base logger itself (fallback)
      expect(result).toBe(mockLogger);
    });
  });
});
