import { describe, it, expect, vi } from "vitest";
import { ok, err } from "@/domain/utils/result";
import {
  FoundryPlatformUtilsAdapter,
  DIFoundryPlatformUtilsAdapter,
} from "../foundry-platform-utils-adapter";

describe("FoundryPlatformUtilsAdapter", () => {
  it("should forward/transform results and map errors", async () => {
    const deepClone = vi.fn(<T>(obj: T) => ok(obj));
    const cleanHTML = vi.fn(() => ok("<p/>"));

    const foundryUtils = {
      randomID: () => "abc",
      fromUuid: async () => ok(null),
      fromUuidSync: () => ok(null),
      parseUuid: () =>
        err({ code: "OPERATION_FAILED", message: "nope", details: { a: 1 }, cause: undefined }),
      buildUuid: () => ok("uuid"),
      deepClone,
      mergeObject: <T>(original: T) => ok(original),
      diffObject: () => ok({}),
      flattenObject: () => ok({}),
      expandObject: () => ok({}),
      cleanHTML,
      escapeHTML: (s: string) => `e:${s}`,
      unescapeHTML: (s: string) => `u:${s}`,
      fetchWithTimeout: async () => ok(new Response("ok")),
      fetchJsonWithTimeout: async () => ok({ ok: true }),
    } as any;

    const adapter = new FoundryPlatformUtilsAdapter(foundryUtils);

    expect(adapter.randomID()).toBe("abc");
    expect((await adapter.fromUuid("x")).ok).toBe(true);
    expect(adapter.fromUuidSync("x").ok).toBe(true);

    const parse = adapter.parseUuid("x");
    expect(parse.ok).toBe(false);
    if (!parse.ok) {
      expect(parse.error.code).toBe("OPERATION_FAILED");
      expect(parse.error.message).toBe("nope");
      expect(parse.error.details).toEqual({ a: 1 });
    }

    expect(adapter.buildUuid("t", "d", "1").ok).toBe(true);
    expect(adapter.deepClone({ a: 1 }).ok).toBe(true);
    expect(deepClone).toHaveBeenCalledOnce();
    expect(adapter.mergeObject({ a: 1 }, {}).ok).toBe(true);
    expect(adapter.diffObject({}, {}).ok).toBe(true);
    expect(adapter.flattenObject({}).ok).toBe(true);
    expect(adapter.expandObject({}).ok).toBe(true);
    expect(adapter.cleanHTML("<x>").ok).toBe(true);
    expect(cleanHTML).toHaveBeenCalledOnce();
    expect(adapter.escapeHTML("<")).toBe("e:<");
    expect(adapter.unescapeHTML("&lt;")).toBe("u:&lt;");
    expect((await adapter.fetchWithTimeout("u", {}, 1)).ok).toBe(true);
    expect((await adapter.fetchJsonWithTimeout("u", {}, 1)).ok).toBe(true);

    // DI wrapper is constructible
    expect(new DIFoundryPlatformUtilsAdapter(foundryUtils)).toBeDefined();
  });
});
