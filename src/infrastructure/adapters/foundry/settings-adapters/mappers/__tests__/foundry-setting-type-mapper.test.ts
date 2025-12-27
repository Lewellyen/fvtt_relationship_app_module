import { describe, it, expect, beforeEach } from "vitest";
import { FoundrySettingTypeMapper } from "../foundry-setting-type-mapper";

describe("FoundrySettingTypeMapper", () => {
  let mapper: FoundrySettingTypeMapper;

  beforeEach(() => {
    mapper = new FoundrySettingTypeMapper();
  });

  describe("map", () => {
    it("should map String constructor to String", () => {
      const result = mapper.map(String);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(String);
      }
    });

    it("should map 'String' string to String constructor", () => {
      const result = mapper.map("String");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(String);
      }
    });

    it("should map Number constructor to Number", () => {
      const result = mapper.map(Number);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(Number);
      }
    });

    it("should map 'Number' string to Number constructor", () => {
      const result = mapper.map("Number");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(Number);
      }
    });

    it("should map Boolean constructor to Boolean", () => {
      const result = mapper.map(Boolean);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(Boolean);
      }
    });

    it("should map 'Boolean' string to Boolean constructor", () => {
      const result = mapper.map("Boolean");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(Boolean);
      }
    });

    it("should return error for unknown type string", () => {
      const result = mapper.map("Unknown" as any);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("SETTING_REGISTRATION_FAILED");
        expect(result.error.message).toContain("Unknown setting type");
        expect(result.error.message).toContain("Unknown");
      }
    });

    it("should return error for unknown type constructor", () => {
      const result = mapper.map(Object as any);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("SETTING_REGISTRATION_FAILED");
        expect(result.error.message).toMatch(/Unknown setting type/);
      }
    });
  });
});
