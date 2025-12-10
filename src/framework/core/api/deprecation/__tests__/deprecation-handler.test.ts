import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { DeprecationHandler } from "../deprecation-handler";
import {
  getDeprecationInfo,
  markAsDeprecated,
} from "@/infrastructure/di/types/utilities/deprecated-token";
import { markAsApiSafe } from "@/infrastructure/di/types/utilities/api-safe-token";
import { createInjectionToken } from "@/infrastructure/di/token-factory";

describe("DeprecationHandler", () => {
  let handler: DeprecationHandler;

  beforeEach(() => {
    handler = new DeprecationHandler();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("checkDeprecation", () => {
    it("should return DeprecationInfo when token is deprecated", async () => {
      const token = markAsApiSafe(createInjectionToken("TestService"));
      const deprecatedToken = markAsDeprecated(token, "Test reason", null, "2.0.0");

      const result = handler.checkDeprecation(deprecatedToken);

      expect(result).not.toBeNull();
      expect(result?.reason).toBe("Test reason");
      expect(result?.removedInVersion).toBe("2.0.0");
    });

    it("should return null when token is not deprecated", () => {
      const token = markAsApiSafe(createInjectionToken("TestService"));

      const result = handler.checkDeprecation(token);

      expect(result).toBeNull();
    });

    it("should return null when getDeprecationInfo returns undefined", async () => {
      // Mock getDeprecationInfo to return undefined
      const deprecatedTokenModule =
        await import("@/infrastructure/di/types/utilities/deprecated-token");
      vi.spyOn(deprecatedTokenModule, "getDeprecationInfo").mockReturnValue(
        undefined as unknown as null
      );

      const token = markAsApiSafe(createInjectionToken("TestService"));

      const result = handler.checkDeprecation(token);

      expect(result).toBeNull();
    });
  });

  describe("handleDeprecationWarning", () => {
    it("should log warning when token is deprecated and warning not shown", () => {
      const token = markAsApiSafe(createInjectionToken("TestService"));
      const replacementToken = createInjectionToken("NewToken");
      const deprecatedToken = markAsDeprecated(token, "Test reason", replacementToken, "2.0.0");

      // Reset warning shown flag
      const deprecationInfo = getDeprecationInfo(deprecatedToken);
      if (deprecationInfo) {
        deprecationInfo.warningShown = false;
      }

      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      handler.handleDeprecationWarning(deprecatedToken);

      expect(warnSpy).toHaveBeenCalledOnce();
      const warningMsg = warnSpy.mock.calls[0]?.[0];
      expect(warningMsg).toBeDefined();
      expect(warningMsg).toContain("DEPRECATED");
      expect(warningMsg).toContain("Test reason");
      expect(warningMsg).toContain("2.0.0");
      expect(warningMsg).toContain("NewToken");

      // Verify warning shown flag is set
      expect(deprecationInfo?.warningShown).toBe(true);

      warnSpy.mockRestore();
    });

    it("should not log warning when token is deprecated but warning already shown", () => {
      const token = markAsApiSafe(createInjectionToken("TestService"));
      const deprecatedToken = markAsDeprecated(token, "Test reason", null, "2.0.0");

      // Set warning shown flag
      const deprecationInfo = getDeprecationInfo(deprecatedToken);
      if (deprecationInfo) {
        deprecationInfo.warningShown = true;
      }

      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      handler.handleDeprecationWarning(deprecatedToken);

      expect(warnSpy).not.toHaveBeenCalled();

      warnSpy.mockRestore();
    });

    it("should not log warning when token is not deprecated", () => {
      const token = markAsApiSafe(createInjectionToken("TestService"));

      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      handler.handleDeprecationWarning(token);

      expect(warnSpy).not.toHaveBeenCalled();

      warnSpy.mockRestore();
    });

    it("should handle token with replacement information", () => {
      const token = markAsApiSafe(createInjectionToken("OldService"));
      const replacementToken = createInjectionToken("NewService");
      const deprecatedToken = markAsDeprecated(
        token,
        "Old service is deprecated",
        replacementToken,
        "3.0.0"
      );

      // Reset warning shown flag
      const deprecationInfo = getDeprecationInfo(deprecatedToken);
      if (deprecationInfo) {
        deprecationInfo.warningShown = false;
      }

      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      handler.handleDeprecationWarning(deprecatedToken);

      expect(warnSpy).toHaveBeenCalledOnce();
      const warningMsg = warnSpy.mock.calls[0]?.[0];
      expect(warningMsg).toContain("NewService");

      warnSpy.mockRestore();
    });

    it("should handle token without replacement information", () => {
      const token = markAsApiSafe(createInjectionToken("OldService"));
      const deprecatedToken = markAsDeprecated(token, "Old service is deprecated", null, "3.0.0");

      // Reset warning shown flag
      const deprecationInfo = getDeprecationInfo(deprecatedToken);
      if (deprecationInfo) {
        deprecationInfo.warningShown = false;
      }

      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      handler.handleDeprecationWarning(deprecatedToken);

      expect(warnSpy).toHaveBeenCalledOnce();
      const warningMsg = warnSpy.mock.calls[0]?.[0];
      expect(warningMsg).toBeDefined();
      expect(warningMsg).not.toContain("Use");

      warnSpy.mockRestore();
    });
  });
});
