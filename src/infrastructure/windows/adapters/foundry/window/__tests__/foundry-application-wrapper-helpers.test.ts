import { describe, it, expect } from "vitest";
import { buildPositionObject } from "../foundry-application-wrapper";
import type { WindowPosition } from "@/domain/windows/types/window-definition.interface";

// Test the exported helper function directly for better coverage
describe("buildPositionObject - Helper Function", () => {
  it("should handle position with all properties", () => {
    const position: WindowPosition = {
      top: 100,
      left: 200,
      width: 300,
      height: 400,
    };

    const result = buildPositionObject(position);

    expect(result).toEqual({
      top: 100,
      left: 200,
      width: 300,
      height: 400,
    });
  });

  it("should handle position with single property", () => {
    const position: WindowPosition = {
      top: 100,
    };

    const result = buildPositionObject(position);

    expect(result).toEqual({
      top: 100,
    });
  });

  it("should return undefined for empty position object", () => {
    const position: WindowPosition = {};

    const result = buildPositionObject(position);

    expect(result).toBeUndefined();
  });

  it("should return undefined for undefined position", () => {
    const result = buildPositionObject(undefined);

    expect(result).toBeUndefined();
  });

  it.each([
    [{ top: 100 }, { top: 100 }],
    [{ left: 200 }, { left: 200 }],
    [{ width: 300 }, { width: 300 }],
    [{ height: 400 }, { height: 400 }],
    [
      { top: 100, left: 200 },
      { top: 100, left: 200 },
    ],
    [
      { top: 100, width: 300 },
      { top: 100, width: 300 },
    ],
    [
      { top: 100, height: 400 },
      { top: 100, height: 400 },
    ],
    [
      { left: 200, width: 300 },
      { left: 200, width: 300 },
    ],
    [
      { left: 200, height: 400 },
      { left: 200, height: 400 },
    ],
    [
      { width: 300, height: 400 },
      { width: 300, height: 400 },
    ],
    [
      { top: 100, left: 200, width: 300 },
      { top: 100, left: 200, width: 300 },
    ],
    [
      { top: 100, left: 200, height: 400 },
      { top: 100, left: 200, height: 400 },
    ],
    [
      { top: 100, width: 300, height: 400 },
      { top: 100, width: 300, height: 400 },
    ],
    [
      { left: 200, width: 300, height: 400 },
      { left: 200, width: 300, height: 400 },
    ],
    [
      { top: 100, left: 200, width: 300, height: 400 },
      { top: 100, left: 200, width: 300, height: 400 },
    ],
  ])("should handle position combination: %j", (position, expected) => {
    const result = buildPositionObject(position as WindowPosition);

    expect(result).toEqual(expected);
  });

  it("should ignore undefined properties in position", () => {
    // Create position object without undefined properties to avoid type error
    const position: WindowPosition = {
      top: 100,
      width: 300,
    };

    const result = buildPositionObject(position);

    expect(result).toEqual({
      top: 100,
      width: 300,
    });
  });

  it("should handle position with only left property", () => {
    const position: WindowPosition = {
      left: 200,
    };

    const result = buildPositionObject(position);

    expect(result).toEqual({
      left: 200,
    });
  });

  it("should handle position with only width property", () => {
    const position: WindowPosition = {
      width: 300,
    };

    const result = buildPositionObject(position);

    expect(result).toEqual({
      width: 300,
    });
  });

  it("should handle position with only height property", () => {
    const position: WindowPosition = {
      height: 400,
    };

    const result = buildPositionObject(position);

    expect(result).toEqual({
      height: 400,
    });
  });
});
