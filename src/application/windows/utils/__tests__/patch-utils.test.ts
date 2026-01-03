import { describe, it, expect } from "vitest";
import { applyPatch } from "../patch-utils";

describe("patch-utils", () => {
  describe("applyPatch", () => {
    it("should apply updates when values differ", () => {
      const target = { count: 0, name: "test" };
      const updates = { count: 1 };

      const result = applyPatch(target, updates);

      expect(result).toBe(true);
      expect(target.count).toBe(1);
      expect(target.name).toBe("test");
    });

    it("should not apply updates when values are the same", () => {
      const target = { count: 0, name: "test" };
      const updates = { count: 0 };

      const result = applyPatch(target, updates);

      expect(result).toBe(false);
      expect(target.count).toBe(0);
      expect(target.name).toBe("test");
    });

    it("should apply multiple updates", () => {
      const target = { count: 0, name: "test", active: false };
      const updates = { count: 5, active: true };

      const result = applyPatch(target, updates);

      expect(result).toBe(true);
      expect(target.count).toBe(5);
      expect(target.name).toBe("test");
      expect(target.active).toBe(true);
    });

    it("should return false when no updates are provided", () => {
      const target = { count: 0, name: "test" };
      const updates = {};

      const result = applyPatch(target, updates);

      expect(result).toBe(false);
      expect(target.count).toBe(0);
      expect(target.name).toBe("test");
    });

    it("should handle partial updates", () => {
      const target = { a: 1, b: 2, c: 3 };
      const updates = { b: 20 };

      const result = applyPatch(target, updates);

      expect(result).toBe(true);
      expect(target.a).toBe(1);
      expect(target.b).toBe(20);
      expect(target.c).toBe(3);
    });

    it("should return false when all updates have same values", () => {
      const target = { count: 0, name: "test", active: false };
      const updates = { count: 0, name: "test", active: false };

      const result = applyPatch(target, updates);

      expect(result).toBe(false);
      expect(target).toEqual({ count: 0, name: "test", active: false });
    });

    it("should return true when some updates differ and some are same", () => {
      const target = { count: 0, name: "test", active: false };
      const updates = { count: 0, active: true }; // count same, active different

      const result = applyPatch(target, updates);

      expect(result).toBe(true);
      expect(target.count).toBe(0);
      expect(target.active).toBe(true);
    });

    it("should handle new properties", () => {
      const target = { count: 0 } as { count: number; newProp?: string };
      const updates = { newProp: "added" } as Partial<typeof target>;

      const result = applyPatch(target, updates);

      expect(result).toBe(true);
      expect(target.count).toBe(0);
      expect(target.newProp).toBe("added");
    });

    it("should handle undefined values", () => {
      const target = { value: "test", optional: "present" } as {
        value: string;
        optional?: string;
      };
      const updates = { optional: undefined } as unknown as Partial<typeof target>;

      const result = applyPatch(target, updates);

      // undefined !== "present", so change should be applied
      expect(result).toBe(true);
      expect(target.value).toBe("test");
      expect(target.optional).toBeUndefined();
    });

    it("should handle null values", () => {
      const target = { value: "test", nullable: "present" } as {
        value: string;
        nullable: string | null;
      };
      const updates = { nullable: null } as Partial<typeof target>;

      const result = applyPatch(target, updates);

      expect(result).toBe(true);
      expect(target.value).toBe("test");
      expect(target.nullable).toBeNull();
    });

    it("should not modify target when updates are identical", () => {
      const target = { a: 1, b: "test" };
      const targetBefore = { ...target };
      const updates = { a: 1 };

      const result = applyPatch(target, updates);

      expect(result).toBe(false);
      expect(target).toEqual(targetBefore);
    });

    it("should handle object with inherited properties", () => {
      const parent = { inherited: "value" };
      const target = Object.create(parent) as { count: number; inherited?: string };
      target.count = 0;

      const updates = { count: 1 };

      const result = applyPatch(target, updates);

      expect(result).toBe(true);
      expect(target.count).toBe(1);
      // hasOwnProperty check ensures we only process own properties
      // inherited properties are not processed by the patch function
      expect("inherited" in target).toBe(true); // Exists in prototype chain
      expect(Object.prototype.hasOwnProperty.call(target, "inherited")).toBe(false);
    });

    it("should skip properties that are not own properties in updates (hasOwnProperty returns false)", () => {
      const target = { count: 0, name: "test" };

      // Create updates object with inherited properties
      // When we iterate with "for...in", we get inherited properties too
      // But hasOwnProperty will return false for inherited properties
      const parent = { count: 1, name: "inherited" };
      const updates = Object.create(parent) as Partial<typeof target>;
      // Add an own property to updates to ensure at least one property is processed
      updates.name = "new";

      const result = applyPatch(target, updates);

      // The inherited property "count" from parent should be skipped (hasOwnProperty returns false)
      // But the own property "name" should be processed
      expect(result).toBe(true);
      expect(target.count).toBe(0); // Not changed because inherited property was skipped
      expect(target.name).toBe("new"); // Changed because own property was processed
    });
  });
});
