/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from "vitest";
import { createReadOnlyWrapper } from "../readonly-wrapper";

describe("readonly-wrapper", () => {
  describe("createReadOnlyWrapper", () => {
    it("should allow whitelisted methods", () => {
      const service = {
        allowed: () => "OK",
        blocked: () => "Should not work",
      };

      const wrapped = createReadOnlyWrapper(service, ["allowed"]);

      expect(wrapped.allowed()).toBe("OK");
    });

    it("should block non-whitelisted methods", () => {
      const service = {
        allowed: () => "OK",
        blocked: () => "Should not work",
      };

      const wrapped = createReadOnlyWrapper(service, ["allowed"]);

      expect(() => wrapped.blocked()).toThrow('Property "blocked" is not accessible');
    });

    it("should block property access", () => {
      const service = {
        publicProp: "visible",
        allowed: () => "OK",
      };

      const wrapped = createReadOnlyWrapper(service, ["allowed"]);

      expect(() => {
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        wrapped.publicProp;
      }).toThrow('Property "publicProp" is not accessible');
    });

    it("should block property modification", () => {
      const service = {
        prop: "original",
        allowed: () => "OK",
      };

      const wrapped = createReadOnlyWrapper(service, ["allowed"]);

      expect(() => {
        (wrapped as any).prop = "modified";
      }).toThrow("Cannot modify services via Public API");
    });

    it("should block property deletion", () => {
      const service = {
        prop: "value",
        allowed: () => "OK",
      };

      const wrapped = createReadOnlyWrapper(service, ["allowed"]);

      expect(() => {
        delete (wrapped as any).prop;
      }).toThrow("Cannot delete properties via Public API");
    });

    it("should preserve 'this' context in methods", () => {
      const service = {
        value: 42,
        getValue() {
          return this.value;
        },
      };

      const wrapped = createReadOnlyWrapper(service, ["getValue"]);

      expect(wrapped.getValue()).toBe(42);
    });

    it("should list allowed methods in error message", () => {
      const service = {
        method1: () => "OK",
        method2: () => "OK",
        blocked: () => "No",
      };

      const wrapped = createReadOnlyWrapper(service, ["method1", "method2"]);

      expect(() => wrapped.blocked()).toThrow("method1, method2");
    });

    it("should work with async methods", async () => {
      const service = {
        async fetchData() {
          return Promise.resolve("data");
        },
      };

      const wrapped = createReadOnlyWrapper(service, ["fetchData"]);

      await expect(wrapped.fetchData()).resolves.toBe("data");
    });

    it("should handle methods with parameters", () => {
      const service = {
        add(a: number, b: number) {
          return a + b;
        },
      };

      const wrapped = createReadOnlyWrapper(service, ["add"]);

      expect(wrapped.add(2, 3)).toBe(5);
    });

    it("should allow non-function properties if whitelisted", () => {
      const service = {
        constantValue: 42,
        method: () => "OK",
      };

      const wrapped = createReadOnlyWrapper(service, ["constantValue", "method"]);

      // Property access should work if whitelisted
      expect(wrapped.constantValue).toBe(42);
    });
  });
});
