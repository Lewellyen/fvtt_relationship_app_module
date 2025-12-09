import { describe, it, expect } from "vitest";
import {
  extractHtmlElement,
  getFactoryOrError,
  castFoundrySettingsApi,
  castDisposablePort,
  castFoundryDocumentForFlag,
  type DynamicSettingsApi,
} from "@/infrastructure/adapters/foundry/runtime-casts";
import { expectResultOk, expectResultErr } from "@/test/utils/test-helpers";
import type { Disposable } from "@/infrastructure/di/interfaces";

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

describe("castFoundrySettingsApi", () => {
  it("should return ok with settings when object has all required methods", () => {
    const settings: DynamicSettingsApi = {
      register: () => {},

      get: <T>() => "value" as any as T,

      set: async <T>(_namespace: string, _key: string, _value: T) => "value" as any as T,
    };

    const result = castFoundrySettingsApi(settings);

    expectResultOk(result);
    expect(result.value).toBe(settings);
  });

  it("should return err when object is missing register method", () => {
    const settings = {
      get: () => "value",
      set: async () => "value",
    };

    const result = castFoundrySettingsApi(settings);

    expectResultErr(result);
    expect(result.error.code).toBe("API_NOT_AVAILABLE");
    expect(result.error.message).toContain("required methods");
  });

  it("should return err when object is missing get method", () => {
    const settings = {
      register: () => {},
      set: async () => "value",
    };

    const result = castFoundrySettingsApi(settings);

    expectResultErr(result);
    expect(result.error.code).toBe("API_NOT_AVAILABLE");
  });

  it("should return err when object is missing set method", () => {
    const settings = {
      register: () => {},
      get: () => "value",
    };

    const result = castFoundrySettingsApi(settings);

    expectResultErr(result);
    expect(result.error.code).toBe("API_NOT_AVAILABLE");
  });

  it("should return err when object has property instead of method", () => {
    const settings = {
      register: "not a function",
      get: () => "value",
      set: async () => "value",
    };

    const result = castFoundrySettingsApi(settings);

    expectResultErr(result);
    expect(result.error.code).toBe("API_NOT_AVAILABLE");
  });

  it("should return err when object is null", () => {
    const result = castFoundrySettingsApi(null);

    expectResultErr(result);
    expect(result.error.code).toBe("API_NOT_AVAILABLE");
  });

  it("should return err when object is undefined", () => {
    const result = castFoundrySettingsApi(undefined);

    expectResultErr(result);
    expect(result.error.code).toBe("API_NOT_AVAILABLE");
  });

  it("should return err when object is primitive", () => {
    const result = castFoundrySettingsApi("string");

    expectResultErr(result);
    expect(result.error.code).toBe("API_NOT_AVAILABLE");
  });
});

describe("castDisposablePort", () => {
  it("should return Disposable when port has dispose method", () => {
    const port: Disposable = {
      dispose: () => {},
    };

    const result = castDisposablePort(port);

    expect(result).toBe(port);
    expect(result).not.toBeNull();
  });

  it("should return null when port is null", () => {
    const result = castDisposablePort(null);
    expect(result).toBeNull();
  });

  it("should return null when port is undefined", () => {
    const result = castDisposablePort(undefined);
    expect(result).toBeNull();
  });

  it("should return null when port has no dispose method", () => {
    const port = { name: "test" };
    const result = castDisposablePort(port);
    expect(result).toBeNull();
  });

  it("should return null when port has dispose property but not method", () => {
    const port = { dispose: "not a function" };
    const result = castDisposablePort(port);
    expect(result).toBeNull();
  });

  it("should return null when port is primitive", () => {
    const result = castDisposablePort("string");
    expect(result).toBeNull();
  });
});

describe("castFoundryDocumentForFlag", () => {
  it("should return ok with document when object has getFlag and setFlag methods", () => {
    const document = {
      getFlag: (_scope: string, _key: string) => "value",
      setFlag: async (_scope: string, _key: string, value: unknown) => value,
    };

    const result = castFoundryDocumentForFlag(document);

    expectResultOk(result);
    expect(result.value).toBe(document);
  });

  it("should return err when object is missing getFlag method", () => {
    const document = {
      setFlag: async (_scope: string, _key: string, value: unknown) => value,
    };

    const result = castFoundryDocumentForFlag(document);

    expectResultErr(result);
    expect(result.error.code).toBe("VALIDATION_FAILED");
    expect(result.error.message).toContain("required methods");
  });

  it("should return err when object is missing setFlag method", () => {
    const document = {
      getFlag: (_scope: string, _key: string) => "value",
    };

    const result = castFoundryDocumentForFlag(document);

    expectResultErr(result);
    expect(result.error.code).toBe("VALIDATION_FAILED");
  });

  it("should return err when object has property instead of method", () => {
    const document = {
      getFlag: "not a function",
      setFlag: async (scope: string, key: string, value: unknown) => value,
    };

    const result = castFoundryDocumentForFlag(document);

    expectResultErr(result);
    expect(result.error.code).toBe("VALIDATION_FAILED");
  });

  it("should return err when object is null", () => {
    const result = castFoundryDocumentForFlag(null);

    expectResultErr(result);
    expect(result.error.code).toBe("VALIDATION_FAILED");
  });

  it("should return err when object is undefined", () => {
    const result = castFoundryDocumentForFlag(undefined);

    expectResultErr(result);
    expect(result.error.code).toBe("VALIDATION_FAILED");
  });

  it("should return err when object is primitive", () => {
    const result = castFoundryDocumentForFlag("string");

    expectResultErr(result);
    expect(result.error.code).toBe("VALIDATION_FAILED");
  });
});
