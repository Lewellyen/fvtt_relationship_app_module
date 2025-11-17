import { describe, it, expect } from "vitest";
import { extractHtmlElement, getFactoryOrError } from "../runtime-casts";
import { expectResultOk, expectResultErr } from "@/test/utils/test-helpers";

describe("extractHtmlElement", () => {
  it("should return HTMLElement when argument is HTMLElement", () => {
    const element = document.createElement("div");
    const result = extractHtmlElement(element);
    expect(result).toBe(element);
  });

  it("should return null when argument is not HTMLElement", () => {
    const result = extractHtmlElement({ invalid: true });
    expect(result).toBeNull();
  });

  it("should return null when argument is null", () => {
    const result = extractHtmlElement(null);
    expect(result).toBeNull();
  });

  it("should return null when argument is undefined", () => {
    const result = extractHtmlElement(undefined);
    expect(result).toBeNull();
  });

  it("should return null when argument is string", () => {
    const result = extractHtmlElement("not an element");
    expect(result).toBeNull();
  });
});

describe("getFactoryOrError", () => {
  it("should return factory when found in map", () => {
    const factories = new Map<number, () => string>();
    const factory = (): string => "test-port";
    factories.set(13, factory);

    const result = getFactoryOrError(factories, 13);

    expectResultOk(result);
    expect(result.value).toBe(factory);
    expect(result.value()).toBe("test-port");
  });

  it("should return error when factory not found", () => {
    const factories = new Map<number, () => string>();

    const result = getFactoryOrError(factories, 13);

    expectResultErr(result);
    expect(result.error.code).toBe("PORT_NOT_FOUND");
    expect(result.error.message).toContain("Factory for version 13 not found");
  });

  it("should return error when version exists but factory is missing", () => {
    const factories = new Map<number, () => string>();
    factories.set(14, () => "port-14");

    const result = getFactoryOrError(factories, 13);

    expectResultErr(result);
    expect(result.error.code).toBe("PORT_NOT_FOUND");
  });
});
