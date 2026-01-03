import { describe, it, expect, beforeEach, vi } from "vitest";
import { RendererRegistry } from "../renderer-registry";
import type { IRenderEnginePort } from "@/domain/windows/ports/render-engine-port.interface";
import { expectResultOk, expectResultErr } from "@/test/utils/test-helpers";

describe("RendererRegistry", () => {
  let registry: RendererRegistry;
  let mockRenderer: IRenderEnginePort;

  beforeEach(() => {
    registry = new RendererRegistry();
    mockRenderer = {
      mount: vi.fn(),
      unmount: vi.fn(),
      update: vi.fn(),
    } as unknown as IRenderEnginePort;
  });

  describe("register", () => {
    it("should register renderer for type", () => {
      registry.register("svelte", mockRenderer);

      const result = registry.get("svelte");

      expectResultOk(result);
      expect(result.value).toBe(mockRenderer);
    });

    it("should allow overwriting existing renderer", () => {
      const renderer1 = {
        mount: vi.fn(),
        unmount: vi.fn(),
        update: vi.fn(),
      } as unknown as IRenderEnginePort;
      const renderer2 = {
        mount: vi.fn(),
        unmount: vi.fn(),
        update: vi.fn(),
      } as unknown as IRenderEnginePort;

      registry.register("svelte", renderer1);
      registry.register("svelte", renderer2);

      const result = registry.get("svelte");

      expectResultOk(result);
      expect(result.value).toBe(renderer2);
      expect(result.value).not.toBe(renderer1);
    });
  });

  describe("get", () => {
    it("should return registered renderer", () => {
      registry.register("svelte", mockRenderer);

      const result = registry.get("svelte");

      expectResultOk(result);
      expect(result.value).toBe(mockRenderer);
    });

    it("should return error if renderer not found", () => {
      const result = registry.get("svelte");

      expectResultErr(result);
      expect(result.error.code).toBe("RendererNotFound");
      expect(result.error.message).toContain("Renderer for type svelte not found");
    });

    it("should return error for different unregistered type", () => {
      registry.register("svelte", mockRenderer);

      const result = registry.get("react" as "svelte");

      expectResultErr(result);
      expect(result.error.code).toBe("RendererNotFound");
      expect(result.error.message).toContain("Renderer for type react not found");
    });
  });
});
