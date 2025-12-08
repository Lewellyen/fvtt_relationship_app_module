/**
 * Tests for FoundryVersionDetector service.
 *
 * Tests the service wrapper around getFoundryVersionResult() that converts
 * string errors to FoundryError objects.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  FoundryVersionDetector,
  DIFoundryVersionDetector,
} from "@/infrastructure/adapters/foundry/versioning/foundry-version-detector";
import { getFoundryVersionResult } from "@/infrastructure/adapters/foundry/versioning/versiondetector";
import { expectResultOk, expectResultErr } from "@/test/utils/test-helpers";
import { ok, err } from "@/domain/utils/result";

vi.mock("@/infrastructure/adapters/foundry/versioning/versiondetector", () => ({
  getFoundryVersionResult: vi.fn(),
  resetVersionCache: vi.fn(),
}));

describe("FoundryVersionDetector", () => {
  let detector: FoundryVersionDetector;

  beforeEach(() => {
    detector = new FoundryVersionDetector();
    vi.clearAllMocks();
  });

  describe("getVersion", () => {
    describe("Success Cases", () => {
      it("should return Ok with version 13", () => {
        vi.mocked(getFoundryVersionResult).mockReturnValue(ok(13));

        const result = detector.getVersion();

        expectResultOk(result);
        expect(result.value).toBe(13);
        expect(getFoundryVersionResult).toHaveBeenCalledTimes(1);
      });

      it("should return Ok with version 14", () => {
        vi.mocked(getFoundryVersionResult).mockReturnValue(ok(14));

        const result = detector.getVersion();

        expectResultOk(result);
        expect(result.value).toBe(14);
        expect(getFoundryVersionResult).toHaveBeenCalledTimes(1);
      });

      it("should return Ok with version 15", () => {
        vi.mocked(getFoundryVersionResult).mockReturnValue(ok(15));

        const result = detector.getVersion();

        expectResultOk(result);
        expect(result.value).toBe(15);
        expect(getFoundryVersionResult).toHaveBeenCalledTimes(1);
      });

      it("should return Ok with any valid version number", () => {
        vi.mocked(getFoundryVersionResult).mockReturnValue(ok(20));

        const result = detector.getVersion();

        expectResultOk(result);
        expect(result.value).toBe(20);
      });
    });

    describe("Error Cases", () => {
      it("should return FoundryError when game is undefined", () => {
        const errorMessage = "Foundry game object is not available or version cannot be determined";
        vi.mocked(getFoundryVersionResult).mockReturnValue(err(errorMessage));

        const result = detector.getVersion();

        expectResultErr(result);
        expect(result.error.code).toBe("VERSION_DETECTION_FAILED");
        expect(result.error.message).toBe("Could not determine Foundry version");
        expect(result.error.cause).toBe(errorMessage);
      });

      it("should return FoundryError when game.version is undefined", () => {
        const errorMessage = "Foundry version is not available on the game object";
        vi.mocked(getFoundryVersionResult).mockReturnValue(err(errorMessage));

        const result = detector.getVersion();

        expectResultErr(result);
        expect(result.error.code).toBe("VERSION_DETECTION_FAILED");
        expect(result.error.message).toBe("Could not determine Foundry version");
        expect(result.error.cause).toBe(errorMessage);
      });

      it("should return FoundryError when version cannot be parsed", () => {
        const errorMessage = "Could not parse Foundry version from: invalid";
        vi.mocked(getFoundryVersionResult).mockReturnValue(err(errorMessage));

        const result = detector.getVersion();

        expectResultErr(result);
        expect(result.error.code).toBe("VERSION_DETECTION_FAILED");
        expect(result.error.message).toBe("Could not determine Foundry version");
        expect(result.error.cause).toBe(errorMessage);
      });

      it("should preserve error message from underlying function", () => {
        const errorMessage = "Custom error message";
        vi.mocked(getFoundryVersionResult).mockReturnValue(err(errorMessage));

        const result = detector.getVersion();

        expectResultErr(result);
        expect(result.error.cause).toBe(errorMessage);
      });
    });

    describe("Service Behavior", () => {
      it("should call getFoundryVersionResult on each invocation", () => {
        vi.mocked(getFoundryVersionResult).mockReturnValue(ok(13));

        detector.getVersion();
        detector.getVersion();
        detector.getVersion();

        expect(getFoundryVersionResult).toHaveBeenCalledTimes(3);
      });

      it("should handle multiple instances independently", () => {
        vi.mocked(getFoundryVersionResult).mockReturnValueOnce(ok(13)).mockReturnValueOnce(ok(14));

        const detector1 = new FoundryVersionDetector();
        const detector2 = new FoundryVersionDetector();

        const result1 = detector1.getVersion();
        const result2 = detector2.getVersion();

        expectResultOk(result1);
        expect(result1.value).toBe(13);
        expectResultOk(result2);
        expect(result2.value).toBe(14);
      });

      it("should convert string error to FoundryError with correct structure", () => {
        const errorMessage = "Test error";
        vi.mocked(getFoundryVersionResult).mockReturnValue(err(errorMessage));

        const result = detector.getVersion();

        expectResultErr(result);
        expect(result.error).toHaveProperty("code");
        expect(result.error).toHaveProperty("message");
        expect(result.error).toHaveProperty("cause");
        expect(result.error.code).toBe("VERSION_DETECTION_FAILED");
        expect(typeof result.error.cause).toBe("string");
      });
    });
  });

  describe("DIFoundryVersionDetector", () => {
    it("should extend FoundryVersionDetector", () => {
      const diDetector = new DIFoundryVersionDetector();

      expect(diDetector).toBeInstanceOf(FoundryVersionDetector);
      expect(diDetector).toBeInstanceOf(DIFoundryVersionDetector);
    });

    it("should have no dependencies", () => {
      expect(DIFoundryVersionDetector.dependencies).toEqual([]);
    });

    it("should work identically to FoundryVersionDetector", () => {
      vi.mocked(getFoundryVersionResult).mockReturnValue(ok(13));

      const diDetector = new DIFoundryVersionDetector();
      const result = diDetector.getVersion();

      expectResultOk(result);
      expect(result.value).toBe(13);
    });
  });
});
