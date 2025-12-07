import { describe, it, expect, beforeEach } from "vitest";
import { ValibotValidationAdapter } from "../valibot-validation-adapter";
import { LogLevel } from "@/domain/types/log-level";
import { expectResultOk, expectResultErr } from "@/test/utils/test-helpers";

describe("ValibotValidationAdapter", () => {
  let adapter: ValibotValidationAdapter;

  beforeEach(() => {
    adapter = new ValibotValidationAdapter();
  });

  describe("validateLogLevel", () => {
    it("should validate valid log level values", () => {
      const validLevels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];

      for (const level of validLevels) {
        const result = adapter.validateLogLevel(level);
        expectResultOk(result);
        expect(result.value).toBe(level);
      }
    });

    it("should return error for invalid log level value", () => {
      const invalidValues = [999, -1, 4, "invalid", null, undefined, {}, [], true, false];

      for (const value of invalidValues) {
        const result = adapter.validateLogLevel(value);
        expectResultErr(result);
        expect(result.error.code).toBe("VALIDATION_FAILED");
        expect(result.error.message).toContain("Invalid log level value");
        expect(result.error.message).toContain(String(value));
        expect(result.error.details).toBeDefined();
      }
    });

    it("should include valid log level options in error message", () => {
      const result = adapter.validateLogLevel(999);
      expectResultErr(result);
      expect(result.error.message).toContain(String(LogLevel.DEBUG));
      expect(result.error.message).toContain(String(LogLevel.INFO));
      expect(result.error.message).toContain(String(LogLevel.WARN));
      expect(result.error.message).toContain(String(LogLevel.ERROR));
    });

    it("should include validation issues in error details", () => {
      const result = adapter.validateLogLevel("not-a-number");
      expectResultErr(result);
      expect(result.error.details).toBeDefined();
      expect(Array.isArray(result.error.details)).toBe(true);
    });
  });
});
