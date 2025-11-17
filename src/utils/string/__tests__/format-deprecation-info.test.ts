import { describe, it, expect } from "vitest";
import { formatReplacementInfo } from "../format-deprecation-info";

describe("formatReplacementInfo", () => {
  it("should return formatted message when replacement is provided", () => {
    const result = formatReplacementInfo("newToken");
    expect(result).toBe('Use "newToken" instead.\n');
  });

  it("should return empty string when replacement is null", () => {
    const result = formatReplacementInfo(null);
    expect(result).toBe("");
  });
});
