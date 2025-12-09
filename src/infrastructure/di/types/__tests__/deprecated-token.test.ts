import { describe, it, expect } from "vitest";
import { markAsDeprecated, getDeprecationInfo } from "@/infrastructure/di/types";
import { createInjectionToken } from "@/infrastructure/di/token-factory";
import type { Logger } from "@/infrastructure/logging/logger.interface";

describe("deprecated-token", () => {
  describe("markAsDeprecated", () => {
    it("should create API-safe token with deprecation metadata", () => {
      const originalToken = createInjectionToken<Logger>("Logger");
      const replacementToken = createInjectionToken<Logger>("LoggerV2");

      const deprecatedToken = markAsDeprecated(
        originalToken,
        "Use enhanced logger v2",
        replacementToken,
        "2.0.0"
      );

      expect(deprecatedToken).toBeDefined();
      expect(typeof deprecatedToken).toBe("symbol");
    });

    it("should attach deprecation metadata to token", () => {
      const originalToken = createInjectionToken<Logger>("Logger");
      const replacementToken = createInjectionToken<Logger>("LoggerV2");

      const deprecatedToken = markAsDeprecated(
        originalToken,
        "Use enhanced logger v2",
        replacementToken,
        "2.0.0"
      );

      const deprecationInfo = getDeprecationInfo(deprecatedToken);
      expect(deprecationInfo).not.toBeNull();
      expect(deprecationInfo?.reason).toBe("Use enhanced logger v2");
      expect(deprecationInfo?.replacement).toBe("Symbol(LoggerV2)");
      expect(deprecationInfo?.removedInVersion).toBe("2.0.0");
      expect(deprecationInfo?.warningShown).toBe(false);
    });

    it("should handle null replacement token", () => {
      const originalToken = createInjectionToken<Logger>("Logger");

      const deprecatedToken = markAsDeprecated(originalToken, "No longer supported", null, "2.0.0");

      const deprecationInfo = getDeprecationInfo(deprecatedToken);
      expect(deprecationInfo).not.toBeNull();
      expect(deprecationInfo?.replacement).toBeNull();
    });

    it("should mark token as API-safe", () => {
      const originalToken = createInjectionToken<Logger>("Logger");

      const deprecatedToken = markAsDeprecated(originalToken, "Deprecated", null, "2.0.0");

      // Token should be API-safe (branded type)
      // We can't directly test the brand, but we can verify it doesn't throw
      expect(deprecatedToken).toBeDefined();
    });
  });

  describe("getDeprecationInfo", () => {
    it("should return deprecation info for deprecated token", () => {
      const token = createInjectionToken<Logger>("Logger");
      const deprecatedToken = markAsDeprecated(token, "Test reason", null, "2.0.0");

      const info = getDeprecationInfo(deprecatedToken);
      expect(info).not.toBeNull();
      expect(info?.reason).toBe("Test reason");
    });

    it("should return null for non-deprecated token", () => {
      const token = createInjectionToken<Logger>("Logger");

      const info = getDeprecationInfo(token);
      expect(info).toBeNull();
    });

    it("should return null for non-token values", () => {
      expect(getDeprecationInfo(null)).toBeNull();
      expect(getDeprecationInfo(undefined)).toBeNull();
      expect(getDeprecationInfo({} as any)).toBeNull();
      expect(getDeprecationInfo("string" as any)).toBeNull();
    });
  });
});
