import { describe, it, expect } from "vitest";
import {
  ok,
  err,
  isOk,
  isErr,
  map,
  mapError,
  andThen,
  unwrapOr,
  unwrapOrElse,
  getOrThrow,
  tryCatch,
  lift,
  all,
  match,
  asyncMap,
  asyncAndThen,
  fromPromise,
  asyncAll,
} from "../result";
import type { Result } from "@/types/result";

describe("Result Utilities", () => {
  describe("Creators", () => {
    it("ok() should create Ok result", () => {
      const result = ok(42);
      expect(result.ok).toBe(true);
      expect(result.value).toBe(42);
    });

    it("err() should create Err result", () => {
      const result = err("error");
      expect(result.ok).toBe(false);
      expect(result.error).toBe("error");
    });
  });

  describe("Type Guards", () => {
    it("isOk() should narrow type to Ok", () => {
      const result: Result<number, string> = ok(42);
      if (isOk(result)) {
        expect(result.value).toBe(42);
        // @ts-expect-error - error should not exist on Ok
        expect(result.error).toBeUndefined();
      }
    });

    it("isErr() should narrow type to Err", () => {
      const result: Result<number, string> = err("error");
      if (isErr(result)) {
        expect(result.error).toBe("error");
        // @ts-expect-error - value should not exist on Err
        expect(result.value).toBeUndefined();
      }
    });
  });

  describe("Transformations", () => {
    it("map() should transform Ok value", () => {
      const result = ok(5);
      const doubled = map(result, (x: number) => x * 2);
      expect(doubled.ok).toBe(true);
      if (doubled.ok) {
        expect(doubled.value).toBe(10);
      }
    });

    it("map() should leave Err unchanged", () => {
      const result = err("error");
      const mapped = map(result, (x: never) => x * 2);
      expect(mapped.ok).toBe(false);
      if (!mapped.ok) {
        expect(mapped.error).toBe("error");
      }
    });

    it("mapError() should transform Err", () => {
      const result = err("404");
      const formatted = mapError(result, (msg) => `Error: ${msg}`);
      expect(formatted.ok).toBe(false);
      if (!formatted.ok) {
        expect(formatted.error).toBe("Error: 404");
      }
    });

    it("mapError() should leave Ok unchanged", () => {
      const result = ok(42);
      const mapped = mapError(result, (msg) => `Error: ${msg}`);
      expect(mapped.ok).toBe(true);
      if (mapped.ok) {
        expect(mapped.value).toBe(42);
      }
    });

    it("andThen() should chain Results", () => {
      const parseNumber = (str: string): Result<number, string> => {
        const num = Number.parseInt(str, 10);
        return isNaN(num) ? err("Invalid number") : ok(num);
      };

      const result = ok("5");
      const chained = andThen(result, parseNumber);
      expect(chained.ok).toBe(true);
      if (chained.ok) {
        expect(chained.value).toBe(5);
      }
    });

    it("andThen() should short-circuit on Err", () => {
      const result = err("initial error");
      const chained = andThen(result, (x: never) => ok(x * 2));
      expect(chained.ok).toBe(false);
      if (!chained.ok) {
        expect(chained.error).toBe("initial error");
      }
    });
  });

  describe("Unwrapping", () => {
    it("unwrapOr() should return value for Ok", () => {
      const result = ok(42);
      expect(unwrapOr(result, 0)).toBe(42);
    });

    it("unwrapOr() should return fallback for Err", () => {
      const result = err("error");
      expect(unwrapOr(result, 0)).toBe(0);
    });

    it("unwrapOrElse() should compute fallback for Err", () => {
      const result = err("not found");
      const value = unwrapOrElse(result, (error) => error.length);
      expect(value).toBe(9);
    });

    it("unwrapOrElse() should return value for Ok", () => {
      const result = ok(42);
      const value = unwrapOrElse(result, () => 0);
      expect(value).toBe(42);
    });

    it("getOrThrow() should return value for Ok", () => {
      const result = ok(42);
      expect(getOrThrow(result)).toBe(42);
    });

    it("getOrThrow() should throw for Err", () => {
      const result = err("error");
      expect(() => getOrThrow(result)).toThrow("error");
    });

    it("getOrThrow() should use custom error converter", () => {
      const result = err("error");
      expect(() => getOrThrow(result, (err) => new Error(`Custom: ${err}`))).toThrow(
        "Custom: error"
      );
    });
  });

  describe("Error Handling", () => {
    it("tryCatch() should wrap successful function", () => {
      const result = tryCatch(
        () => JSON.parse('{"value": 42}'),
        (e) => `Parse error: ${e}`
      );
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual({ value: 42 });
      }
    });

    it("tryCatch() should catch exceptions", () => {
      const result = tryCatch(
        () => JSON.parse("{ invalid json"),
        (e) => `Parse error: ${e}`
      );
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("Parse error");
      }
    });

    it("lift() should lift function to Result", () => {
      const parseJSON = lift(
        (str: string) => JSON.parse(str),
        (e) => `Invalid JSON: ${e}`
      );

      const result = parseJSON('{"key": "value"}');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual({ key: "value" });
      }
    });

    it("lift() should catch exceptions", () => {
      const parseJSON = lift(
        (str: string) => JSON.parse(str),
        (e) => `Invalid JSON: ${e}`
      );

      const result = parseJSON("{ invalid }");
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("Invalid JSON");
      }
    });
  });

  describe("Combinators", () => {
    it("all() should combine multiple Results", () => {
      const results = [ok(1), ok(2), ok(3)];
      const combined = all(results);
      expect(combined.ok).toBe(true);
      if (combined.ok) {
        expect(combined.value).toEqual([1, 2, 3]);
      }
    });

    it("all() should short-circuit on first error", () => {
      const results = [ok(1), err("error"), ok(3)];
      const combined = all(results);
      expect(combined.ok).toBe(false);
      if (!combined.ok) {
        expect(combined.error).toBe("error");
      }
    });

    it("match() should execute onOk for Ok", () => {
      const result = ok(42);
      const value = match(result, {
        onOk: (v) => v * 2,
        onErr: () => 0,
      });
      expect(value).toBe(84);
    });

    it("match() should execute onErr for Err", () => {
      const result = err("error");
      const value = match(result, {
        onOk: () => 0,
        onErr: (e) => e.length,
      });
      expect(value).toBe(5);
    });
  });

  describe("Async Operations", () => {
    it("asyncMap() should transform async Result", async () => {
      const asyncResult = Promise.resolve(ok(5));
      const doubled = await asyncMap(asyncResult, (x: number) => Promise.resolve(x * 2));
      expect(doubled.ok).toBe(true);
      if (doubled.ok) {
        expect(doubled.value).toBe(10);
      }
    });

    it("asyncMap() should handle sync transform", async () => {
      const asyncResult = Promise.resolve(ok(5));
      const doubled = await asyncMap(asyncResult, (x: number) => x * 2);
      expect(doubled.ok).toBe(true);
      if (doubled.ok) {
        expect(doubled.value).toBe(10);
      }
    });

    it("asyncMap() should leave Err unchanged", async () => {
      const asyncResult = Promise.resolve(err("error"));
      const mapped = await asyncMap(asyncResult, (x: never) => x * 2);
      expect(mapped.ok).toBe(false);
      if (!mapped.ok) {
        expect(mapped.error).toBe("error");
      }
    });

    it("asyncAndThen() should chain async Results", async () => {
      const asyncResult = Promise.resolve(ok(5));
      const chained = await asyncAndThen(asyncResult, (x: number) => Promise.resolve(ok(x * 2)));
      expect(chained.ok).toBe(true);
      if (chained.ok) {
        expect(chained.value).toBe(10);
      }
    });

    it("asyncAndThen() should short-circuit on Err", async () => {
      const asyncResult = Promise.resolve(err("error"));
      const chained = await asyncAndThen(asyncResult, (x: never) => Promise.resolve(ok(x * 2)));
      expect(chained.ok).toBe(false);
      if (!chained.ok) {
        expect(chained.error).toBe("error");
      }
    });

    it("fromPromise() should convert resolved Promise", async () => {
      const promise = Promise.resolve(42);
      const result = await fromPromise(promise, (e) => `Error: ${e}`);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(42);
      }
    });

    it("fromPromise() should convert rejected Promise", async () => {
      const promise = Promise.reject(new Error("rejected"));
      const result = await fromPromise(promise, (e) => `Error: ${e}`);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("Error");
      }
    });

    it("asyncAll() should combine async Results", async () => {
      const asyncResults = [Promise.resolve(ok(1)), Promise.resolve(ok(2)), Promise.resolve(ok(3))];
      const combined = await asyncAll(asyncResults);
      expect(combined.ok).toBe(true);
      if (combined.ok) {
        expect(combined.value).toEqual([1, 2, 3]);
      }
    });

    it("asyncAll() should short-circuit on first error", async () => {
      const asyncResults = [
        Promise.resolve(ok(1)),
        Promise.resolve(err("error")),
        Promise.resolve(ok(3)),
      ];
      const combined = await asyncAll(asyncResults);
      expect(combined.ok).toBe(false);
      if (!combined.ok) {
        expect(combined.error).toBe("error");
      }
    });
  });
});
