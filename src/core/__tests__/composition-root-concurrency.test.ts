import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { CompositionRoot } from "../composition-root";
import { expectResultOk } from "@/test/utils/test-helpers";

describe("Concurrency: CompositionRoot Bootstrap", () => {
  beforeEach(() => {
    vi.stubGlobal("game", {
      version: "13.291",
      modules: new Map([
        ["fvtt_relationship_app_module", { id: "fvtt_relationship_app_module", api: undefined }],
      ]),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it.concurrent("should handle concurrent bootstrap calls", async () => {
    // Mehrere parallele Bootstrap-Versuche
    const promises = Array.from({ length: 5 }, async () => {
      const root = new CompositionRoot();
      return root.bootstrap();
    });

    const results = await Promise.all(promises);

    // Alle sollten erfolgreich sein
    results.forEach((result) => {
      expectResultOk(result);
    });

    // Alle Container sollten initialisiert sein
    results.forEach((result) => {
      if (result.ok) {
        // Container should be valid (even if token doesn't exist, container should be initialized)
        expect(result.value).toBeInstanceOf(Object);
      }
    });
  });

  it.concurrent("should create valid containers for concurrent bootstrap calls", async () => {
    // 10 parallele Bootstrap-Aufrufe
    const promises = Array.from({ length: 10 }, async () => {
      const root = new CompositionRoot();
      const bootstrapResult = root.bootstrap();
      if (!bootstrapResult.ok) {
        return { ok: false as const, error: bootstrapResult.error };
      }
      const containerResult = root.getContainer();
      return { ok: true as const, value: containerResult };
    });

    const results = await Promise.all(promises);

    // Alle sollten erfolgreich sein
    results.forEach((result) => {
      expect(result.ok).toBe(true);
      if (result.ok) {
        expectResultOk(result.value);
        // Container sollte initialisiert sein
        expect(result.value.value).toBeDefined();
      }
    });
  });

  it.concurrent("should handle multiple bootstrap calls on same instance", async () => {
    const root = new CompositionRoot();

    // Mehrere parallele Bootstrap-Aufrufe auf derselben Instanz
    const promises = Array.from({ length: 5 }, () => root.bootstrap());

    const results = await Promise.all(promises);

    // Alle sollten erfolgreich sein
    results.forEach((result) => {
      expectResultOk(result);
    });

    // getContainer() sollte funktionieren
    const containerResult = root.getContainer();
    expectResultOk(containerResult);
    expect(containerResult.value).toBeDefined();
  });
});
