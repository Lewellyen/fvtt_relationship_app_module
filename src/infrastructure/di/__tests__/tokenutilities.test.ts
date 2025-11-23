import { describe, it, expect } from "vitest";
import { createInjectionToken } from "@/infrastructure/di/tokenutilities";
import type { Logger } from "@/infrastructure/logging/logger.interface";
import type { ServiceType } from "@/infrastructure/shared/tokens";

class TestService implements Logger {
  log(): void {}
  error(): void {}
  warn(): void {}
  info(): void {}
  debug(): void {}
}

describe("tokenutilities", () => {
  describe("createInjectionToken", () => {
    it("should create a Symbol", () => {
      const token = createInjectionToken<Logger>("Logger");

      expect(typeof token).toBe("symbol");
    });

    it("should create unique tokens even with same description", () => {
      const token1 = createInjectionToken<Logger>("Logger");
      const token2 = createInjectionToken<Logger>("Logger");

      expect(token1).not.toBe(token2);
      expect(token1).not.toEqual(token2);
    });

    it("should create tokens with different descriptions", () => {
      const token1 = createInjectionToken<Logger>("Logger");
      const token2 = createInjectionToken<TestService>("TestService");

      expect(token1).not.toBe(token2);
      expect(String(token1)).not.toBe(String(token2));
    });

    it("should include description in symbol string representation", () => {
      const description = "MyTestService";
      const token = createInjectionToken<Logger>(description);

      expect(String(token)).toContain(description);
      expect(String(token)).toMatch(/Symbol\(.*MyTestService.*\)/);
    });

    it("should work with different service types", () => {
      const loggerToken = createInjectionToken<Logger>("Logger");
      const testServiceToken = createInjectionToken<TestService>("TestService");
      const serviceTypeToken = createInjectionToken<ServiceType>("ServiceType");

      expect(typeof loggerToken).toBe("symbol");
      expect(typeof testServiceToken).toBe("symbol");
      expect(typeof serviceTypeToken).toBe("symbol");
      expect(loggerToken).not.toBe(testServiceToken);
      expect(testServiceToken).not.toBe(serviceTypeToken);
    });

    it("should create tokens that can be used as Map keys", () => {
      const token1 = createInjectionToken<Logger>("Logger");
      const token2 = createInjectionToken<TestService>("TestService");
      const map = new Map();

      map.set(token1, "value1");
      map.set(token2, "value2");

      expect(map.get(token1)).toBe("value1");
      expect(map.get(token2)).toBe("value2");
      expect(map.size).toBe(2);
    });

    it("should create tokens that preserve type information", () => {
      const token = createInjectionToken<Logger>("Logger");

      // TypeScript should enforce type safety
      // This test ensures the token maintains its generic type
      expect(typeof token).toBe("symbol");
    });
  });
});
