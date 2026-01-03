import type { IRendererRegistry } from "@/domain/windows/ports/renderer-registry-port.interface";
import type { RenderEngineType } from "@/domain/windows/types/component-descriptor.interface";
import type { IRenderEnginePort } from "@/domain/windows/ports/render-engine-port.interface";
import type { RenderError } from "@/domain/windows/types/errors/render-error.interface";
import { ok, err } from "@/domain/utils/result";

/**
 * RendererRegistry - Verwaltet Render-Engine-Implementierungen
 */
export class RendererRegistry implements IRendererRegistry {
  private readonly renderers = new Map<RenderEngineType, IRenderEnginePort>();

  register(type: RenderEngineType, renderer: IRenderEnginePort): void {
    this.renderers.set(type, renderer);
  }

  get(
    type: RenderEngineType
  ): import("@/domain/types/result").Result<IRenderEnginePort, RenderError> {
    const renderer = this.renderers.get(type);
    if (!renderer) {
      return err({
        code: "RendererNotFound",
        message: `Renderer for type ${type} not found`,
      });
    }

    return ok(renderer);
  }
}
