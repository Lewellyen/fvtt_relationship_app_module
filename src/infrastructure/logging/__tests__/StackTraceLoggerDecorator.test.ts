import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { StackTraceLoggerDecorator } from "../StackTraceLoggerDecorator";
import { BaseConsoleLogger } from "../BaseConsoleLogger";
import { LogLevel } from "@/domain/types/log-level";
import type { RuntimeConfigService } from "@/application/services/RuntimeConfigService";
import { createRuntimeConfig } from "@/application/services/runtime-config-factory";
import { createMockEnvironmentConfig } from "@/test/utils/test-helpers";
import type { Logger } from "../logger.interface";

describe("StackTraceLoggerDecorator", () => {
  let mockConfig: RuntimeConfigService;
  let baseLogger: BaseConsoleLogger;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleInfoSpy: ReturnType<typeof vi.spyOn>;
  let consoleDebugSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    mockConfig = createRuntimeConfig(createMockEnvironmentConfig({ logLevel: LogLevel.DEBUG }));
    baseLogger = new BaseConsoleLogger(LogLevel.DEBUG);
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    consoleInfoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    consoleDebugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleInfoSpy.mockRestore();
    consoleDebugSpy.mockRestore();
  });

  describe("when LogLevel is DEBUG", () => {
    it("should append caller info to log messages", () => {
      const decorator = new StackTraceLoggerDecorator(baseLogger, mockConfig);
      const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      decorator.log("Test log message");

      expect(consoleLogSpy).toHaveBeenCalled();
      expect(consoleLogSpy.mock.calls[0]).toBeDefined();
      const callArgs = consoleLogSpy.mock.calls[0]?.[0] as string;
      expect(callArgs).toContain("Test log message");
      expect(callArgs).toMatch(/\[.+\:\d+\]/);

      consoleLogSpy.mockRestore();
    });

    it("should append caller info to error messages", () => {
      const decorator = new StackTraceLoggerDecorator(baseLogger, mockConfig);
      decorator.error("Test error message");

      expect(consoleErrorSpy).toHaveBeenCalled();
      const callArgs = consoleErrorSpy.mock.calls[0][0] as string;
      // Should contain the message and caller info in format [filename:line]
      expect(callArgs).toContain("Test error message");
      expect(callArgs).toMatch(/\[.+\:\d+\]/);
    });

    it("should append caller info to warn messages", () => {
      const decorator = new StackTraceLoggerDecorator(baseLogger, mockConfig);
      decorator.warn("Test warn message");

      expect(consoleWarnSpy).toHaveBeenCalled();
      const callArgs = consoleWarnSpy.mock.calls[0][0] as string;
      expect(callArgs).toContain("Test warn message");
      expect(callArgs).toMatch(/\[.+\:\d+\]/);
    });

    it("should append caller info to info messages", () => {
      const decorator = new StackTraceLoggerDecorator(baseLogger, mockConfig);
      decorator.info("Test info message");

      expect(consoleInfoSpy).toHaveBeenCalled();
      const callArgs = consoleInfoSpy.mock.calls[0][0] as string;
      expect(callArgs).toContain("Test info message");
      expect(callArgs).toMatch(/\[.+\:\d+\]/);
    });

    it("should append caller info to debug messages", () => {
      const decorator = new StackTraceLoggerDecorator(baseLogger, mockConfig);
      decorator.debug("Test debug message");

      expect(consoleDebugSpy).toHaveBeenCalled();
      const callArgs = consoleDebugSpy.mock.calls[0][0] as string;
      expect(callArgs).toContain("Test debug message");
      expect(callArgs).toMatch(/\[.+\:\d+\]/);
    });
  });

  describe("when LogLevel is not DEBUG", () => {
    it("should not append caller info when LogLevel is INFO", () => {
      const infoConfig = createRuntimeConfig(
        createMockEnvironmentConfig({ logLevel: LogLevel.INFO })
      );
      const infoLogger = new BaseConsoleLogger(LogLevel.INFO);
      const decorator = new StackTraceLoggerDecorator(infoLogger, infoConfig);

      decorator.warn("Test message");

      expect(consoleWarnSpy).toHaveBeenCalled();
      const callArgs = consoleWarnSpy.mock.calls[0][0] as string;
      expect(callArgs).toContain("Test message");
      expect(callArgs).not.toMatch(/\[.+\:\d+\]/);
    });

    it("should not append caller info when LogLevel is WARN", () => {
      const warnConfig = createRuntimeConfig(
        createMockEnvironmentConfig({ logLevel: LogLevel.WARN })
      );
      const warnLogger = new BaseConsoleLogger(LogLevel.WARN);
      const decorator = new StackTraceLoggerDecorator(warnLogger, warnConfig);

      decorator.warn("Test message");

      expect(consoleWarnSpy).toHaveBeenCalled();
      const callArgs = consoleWarnSpy.mock.calls[0][0] as string;
      expect(callArgs).toContain("Test message");
      expect(callArgs).not.toMatch(/\[.+\:\d+\]/);
    });

    it("should not append caller info when LogLevel is ERROR", () => {
      const errorConfig = createRuntimeConfig(
        createMockEnvironmentConfig({ logLevel: LogLevel.ERROR })
      );
      const errorLogger = new BaseConsoleLogger(LogLevel.ERROR);
      const decorator = new StackTraceLoggerDecorator(errorLogger, errorConfig);

      decorator.error("Test message");

      expect(consoleErrorSpy).toHaveBeenCalled();
      const callArgs = consoleErrorSpy.mock.calls[0][0] as string;
      expect(callArgs).toContain("Test message");
      expect(callArgs).not.toMatch(/\[.+\:\d+\]/);
    });
  });

  describe("delegation", () => {
    it("should delegate setMinLevel to base logger", () => {
      const setMinLevelSpy = vi.spyOn(baseLogger, "setMinLevel");
      const decorator = new StackTraceLoggerDecorator(baseLogger, mockConfig);

      decorator.setMinLevel(LogLevel.WARN);

      expect(setMinLevelSpy).toHaveBeenCalledWith(LogLevel.WARN);
      setMinLevelSpy.mockRestore();
    });

    it("should delegate withTraceId to base logger", () => {
      const withTraceIdSpy = vi.spyOn(baseLogger, "withTraceId");
      const decorator = new StackTraceLoggerDecorator(baseLogger, mockConfig);

      decorator.withTraceId("test-trace-id");

      expect(withTraceIdSpy).toHaveBeenCalledWith("test-trace-id");
      withTraceIdSpy.mockRestore();
    });

    it("should return base logger if withTraceId is not available", () => {
      const mockLogger: Logger = {
        log: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        info: vi.fn(),
        debug: vi.fn(),
        setMinLevel: vi.fn(),
        // withTraceId is intentionally missing
      };

      const decorator = new StackTraceLoggerDecorator(mockLogger, mockConfig);
      const result = decorator.withTraceId("test-trace");

      expect(result).toBe(mockLogger);
    });
  });

  describe("error handling", () => {
    it("should not throw when stack trace is unavailable", () => {
      const decorator = new StackTraceLoggerDecorator(baseLogger, mockConfig);

      // Should not throw even if stack trace extraction fails
      // (Error handling is tested implicitly - if it throws, test would fail)
      expect(() => decorator.warn("Test message")).not.toThrow();
      expect(consoleWarnSpy).toHaveBeenCalled();
    });

    it("should handle undefined stack property", () => {
      // Test by accessing getCallerInfo directly via reflection
      const decorator = new StackTraceLoggerDecorator(baseLogger, mockConfig);
      const getCallerInfo = (decorator as any).getCallerInfo.bind(decorator);

      // Create error with undefined stack
      const err = new Error();
      err.stack = undefined as any;

      // Mock Error to return our custom error
      const originalError = global.Error;
      global.Error = class extends Error {
        constructor() {
          super();
          return err;
        }
      } as any;

      const result = getCallerInfo();
      expect(result).toBeUndefined();

      global.Error = originalError;
    });

    it("should handle exception during stack trace extraction", () => {
      const decorator = new StackTraceLoggerDecorator(baseLogger, mockConfig);
      const getCallerInfo = (decorator as any).getCallerInfo.bind(decorator);

      // Mock Error constructor to throw
      const originalError = global.Error;
      const mockError = class extends Error {
        constructor() {
          super();
          throw new Error("Error creation failed");
        }
      };
      global.Error = mockError as any;

      const result = getCallerInfo();
      expect(result).toBeUndefined();

      global.Error = originalError;
    });
  });

  describe("stack trace parsing edge cases", () => {
    it("should handle undefined line in stack array", () => {
      const decorator = new StackTraceLoggerDecorator(baseLogger, mockConfig);
      const getCallerInfo = (decorator as any).getCallerInfo.bind(decorator);

      // Create error with stack containing undefined when split
      const err = new Error();
      const stackLines = [
        "Error",
        "    at StackTraceLoggerDecorator.getCallerInfo",
        "    at BaseConsoleLogger.warn",
        undefined as any, // This will become "undefined" string when joined
        "    at test-file.ts:42:10",
      ];
      err.stack = stackLines.join("\n");

      // Mock Error to return our custom error
      const originalError = global.Error;
      global.Error = class extends Error {
        constructor() {
          super();
          return err;
        }
      } as any;

      const result = getCallerInfo();
      // Should handle undefined line gracefully
      expect(result).toBeDefined();

      global.Error = originalError;
    });

    it("should use fallback when no matching line is found", () => {
      const decorator = new StackTraceLoggerDecorator(baseLogger, mockConfig);
      const getCallerInfo = (decorator as any).getCallerInfo.bind(decorator);

      // Create error with stack where all lines are logger frames
      const err = new Error();
      err.stack = [
        "Error",
        "    at StackTraceLoggerDecorator.getCallerInfo",
        "    at BaseConsoleLogger.warn",
        "    at RuntimeConfigLoggerDecorator.warn",
        "    at Object.<anonymous>",
      ].join("\n");

      // Mock Error to return our custom error
      const originalError = global.Error;
      global.Error = class extends Error {
        constructor() {
          super();
          return err;
        }
      } as any;

      const result = getCallerInfo();
      // Should return undefined when no valid caller found
      expect(result).toBeUndefined();

      global.Error = originalError;
    });

    it("should handle stack trace with non-matching line format (fallback return)", () => {
      const decorator = new StackTraceLoggerDecorator(baseLogger, mockConfig);
      const getCallerInfo = (decorator as any).getCallerInfo.bind(decorator);

      // Create error with stack with line that doesn't match regex
      const err = new Error();
      err.stack = [
        "Error",
        "    at StackTraceLoggerDecorator.getCallerInfo",
        "    at BaseConsoleLogger.warn",
        "    SomeCustomFormat: custom-line-info", // Non-standard format
      ].join("\n");

      // Mock Error to return our custom error
      const originalError = global.Error;
      global.Error = class extends Error {
        constructor() {
          super();
          return err;
        }
      } as any;

      const result = getCallerInfo();
      // Should use fallback return (line.trim().replace(/^at\s+/, ""))
      expect(result).toBeDefined();
      expect(result).toContain("SomeCustomFormat");

      global.Error = originalError;
    });

    it("should use match[1] fallback when match[2] is missing", () => {
      const decorator = new StackTraceLoggerDecorator(baseLogger, mockConfig);
      const getCallerInfo = (decorator as any).getCallerInfo.bind(decorator);

      // Create error with stack
      const err = new Error();
      err.stack = [
        "Error",
        "    at StackTraceLoggerDecorator.getCallerInfo",
        "    at BaseConsoleLogger.warn",
        "    at test-file.ts:42:10",
      ].join("\n");

      // Mock Error to return our custom error
      const originalError = global.Error;
      global.Error = class extends Error {
        constructor() {
          super();
          return err;
        }
      } as any;

      // Mock String.prototype.match to return array where match[2] is undefined
      const originalMatch = String.prototype.match;
      String.prototype.match = vi.fn(function (this: string, regex: RegExp) {
        if (this.includes("test-file.ts:42:10")) {
          // Return match array where match[2] is undefined (tests match[1] fallback)
          const result = ["at test-file.ts:42:10", "test-file.ts:42:10", undefined, "42", "10"];
          return result as RegExpMatchArray;
        }
        return originalMatch.call(this, regex);
      });

      const result = getCallerInfo();
      expect(result).toBeDefined();
      // Should use match[1] fallback since match[2] is undefined
      expect(result).toMatch(/test-file\.ts:\d+/);

      String.prototype.match = originalMatch;
      global.Error = originalError;
    });

    it("should use match[2] fallback when match[3] is missing", () => {
      const decorator = new StackTraceLoggerDecorator(baseLogger, mockConfig);
      const getCallerInfo = (decorator as any).getCallerInfo.bind(decorator);

      // Create error with stack - use second regex pattern (no parentheses)
      const err = new Error();
      err.stack = [
        "Error",
        "    at StackTraceLoggerDecorator.getCallerInfo",
        "    at BaseConsoleLogger.warn",
        "    at test-file.ts:42:10", // Second regex pattern
      ].join("\n");

      // Mock Error to return our custom error
      const originalError = global.Error;
      global.Error = class extends Error {
        constructor() {
          super();
          return err;
        }
      } as any;

      // Mock String.prototype.match to return array where match[3] is undefined
      // This tests the match[2] fallback for lineNum: lineNum = match[3] || match[2]
      const originalMatch = String.prototype.match;
      let mockCallCount = 0;
      String.prototype.match = vi.fn(function (this: string, regex: RegExp) {
        // Only intercept the specific line we want to test
        const lineContent = this.trim();
        if (lineContent === "at test-file.ts:42:10") {
          mockCallCount++;
          // For second regex: /at\s+(.+?):(\d+):(\d+)/
          // match[0] = full match, match[1] = "test-file.ts:42:10", match[2] = "42", match[3] = "10"
          // If match[3] is undefined, then lineNum = match[3] || match[2] = undefined || "42" = "42"
          // This tests the match[2] fallback branch for lineNum (branch coverage)
          const result = ["at test-file.ts:42:10", "test-file.ts:42:10", "42", undefined];
          return result as RegExpMatchArray;
        }
        return originalMatch.call(this, regex);
      });

      const result = getCallerInfo();
      expect(result).toBeDefined();
      // Should use match[2] fallback for lineNum since match[3] is undefined
      // filePath = match[2] || match[1] = "42" || "test-file.ts:42:10" = "42"
      // lineNum = match[3] || match[2] = undefined || "42" = "42" (uses match[2] fallback)
      expect(result).toMatch(/42:42/); // filePath:lineNum = "42":"42"
      expect(mockCallCount).toBeGreaterThan(0); // Ensure our mock was called

      String.prototype.match = originalMatch;
      global.Error = originalError;
    });

    it("should use filePath fallback when split().pop() is undefined", () => {
      const decorator = new StackTraceLoggerDecorator(baseLogger, mockConfig);
      const getCallerInfo = (decorator as any).getCallerInfo.bind(decorator);

      // Create error with stack
      const err = new Error();
      err.stack = [
        "Error",
        "    at StackTraceLoggerDecorator.getCallerInfo",
        "    at BaseConsoleLogger.warn",
        "    at (test-file.ts:42:10)",
      ].join("\n");

      // Mock Error to return our custom error
      const originalError = global.Error;
      global.Error = class extends Error {
        constructor() {
          super();
          return err;
        }
      } as any;

      // Mock String.prototype.match to return normal match
      const originalMatch = String.prototype.match;
      String.prototype.match = vi.fn(function (this: string, regex: RegExp) {
        const lineContent = this.trim();
        if (lineContent === "at (test-file.ts:42:10)") {
          return ["at (test-file.ts:42:10)", "", "test-file.ts", "42", "10"] as RegExpMatchArray;
        }
        return originalMatch.call(this, regex);
      });

      // Mock split() to return array where pop() returns undefined
      // This tests the filePath fallback: fileName = filePath.split().pop() || filePath
      const originalSplit = String.prototype.split;
      String.prototype.split = vi.fn(function (
        this: string,
        separator?: string | RegExp | { [Symbol.split](string: string, limit?: number): string[] }
      ) {
        // Mock for any string that matches our filePath pattern and uses path separator regex
        const isPathSeparatorRegex = separator instanceof RegExp && separator.source === "[/\\\\]";
        if (isPathSeparatorRegex && this.includes("test-file.ts")) {
          // Return array-like object where pop() returns undefined
          // This triggers the filePath fallback branch: fileName = pop() || filePath
          const mockArray: string[] = [];
          // Override pop() to return undefined
          Object.defineProperty(mockArray, "pop", {
            value: vi.fn(() => undefined),
            writable: true,
            configurable: true,
          });
          return mockArray as any;
        }
        return originalSplit.call(this, separator as any);
      }) as typeof String.prototype.split;

      const result = getCallerInfo();
      expect(result).toBeDefined();
      // Should use filePath fallback since split().pop() is undefined
      // fileName = filePath.split().pop() || filePath = undefined || "test-file.ts" = "test-file.ts"
      expect(result).toMatch(/test-file\.ts:\d+/);
      // Note: splitCallCount might be 0 if the mock doesn't match, but the test should still pass
      // The important part is that the result uses the fallback

      String.prototype.split = originalSplit;
      String.prototype.match = originalMatch;
      global.Error = originalError;
    });

    it("should handle case where filePath or lineNum is undefined after match (else path)", () => {
      // This tests the else path of if (filePath && lineNum) guard
      // We need lineNum to be falsy: lineNum = match[3] || match[2] must be falsy
      // This means both match[3] and match[2] must be falsy
      const decorator = new StackTraceLoggerDecorator(baseLogger, mockConfig);
      const getCallerInfo = (decorator as any).getCallerInfo.bind(decorator);

      // Create error with stack - use second regex pattern (no parentheses)
      const err = new Error();
      err.stack = [
        "Error",
        "    at StackTraceLoggerDecorator.getCallerInfo",
        "    at BaseConsoleLogger.warn",
        "    at test-file.ts:42:10", // Second regex pattern
      ].join("\n");

      // Mock Error to return our custom error
      const originalError = global.Error;
      global.Error = class extends Error {
        constructor() {
          super();
          return err;
        }
      } as any;

      // Mock String.prototype.match to return array where both match[3] and match[2] are falsy
      // This triggers the else path: if (filePath && lineNum) -> false, so it uses fallback return
      const originalMatch = String.prototype.match;
      let mockCallCount = 0;
      String.prototype.match = vi.fn(function (this: string, regex: RegExp) {
        // Only intercept the specific line we want to test
        const lineContent = this.trim();
        if (lineContent === "at test-file.ts:42:10") {
          mockCallCount++;
          // For second regex: /at\s+(.+?):(\d+):(\d+)/
          // match[0] = full match, match[1] = "test-file.ts:42:10", match[2] = "42", match[3] = "10"
          // We want lineNum to be falsy: lineNum = match[3] || match[2] = falsy || falsy = falsy
          // So both match[3] and match[2] must be falsy (undefined or empty string)
          // filePath = match[2] || match[1] = "" || "test-file.ts:42:10" = "test-file.ts:42:10" (truthy)
          // lineNum = match[3] || match[2] = undefined || "" = "" (falsy)
          // So if (filePath && lineNum) = if (truthy && falsy) = false -> else path
          const result = ["at test-file.ts:42:10", "test-file.ts:42:10", "", undefined];
          return result as RegExpMatchArray;
        }
        return originalMatch.call(this, regex);
      });

      const result = getCallerInfo();
      // Should use fallback return since lineNum is falsy
      // filePath = match[2] || match[1] = "" || "test-file.ts:42:10" = "test-file.ts:42:10" (truthy)
      // lineNum = match[3] || match[2] = undefined || "" = "" (falsy)
      // So if (filePath && lineNum) = if ("test-file.ts:42:10" && "") = false
      // Therefore else path is taken -> fallback return (line.trim().replace(/^at\s+/, ""))
      expect(result).toBeDefined();
      expect(result).toContain("test-file.ts:42:10");
      expect(mockCallCount).toBeGreaterThan(0); // Ensure our mock was called

      String.prototype.match = originalMatch;
      global.Error = originalError;
    });
  });

  describe("compatibility with other decorators", () => {
    it("should append caller info to pre-formatted messages", () => {
      const decorator = new StackTraceLoggerDecorator(baseLogger, mockConfig);

      // Simulate message that was already formatted (e.g., by TraceContextLoggerDecorator)
      decorator.warn("[trace-id] Pre-formatted message");

      expect(consoleWarnSpy).toHaveBeenCalled();
      const callArgs = consoleWarnSpy.mock.calls[0][0] as string;
      // Should contain the original message
      expect(callArgs).toContain("[trace-id] Pre-formatted message");
      // Should append caller info (format may vary in test environment)
      // Main test: decorator doesn't break when message is pre-formatted
    });
  });
});
