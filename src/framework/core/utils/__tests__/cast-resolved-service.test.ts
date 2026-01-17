import { describe, it, expect } from "vitest";
import { castResolvedService } from "../cast-resolved-service";

describe("castResolvedService", () => {
  it("should return the same reference for objects", () => {
    const obj = { a: 1 };
    expect(castResolvedService(obj)).toBe(obj);
  });

  it("should return the same value for primitives", () => {
    expect(castResolvedService(123)).toBe(123);
  });
});
