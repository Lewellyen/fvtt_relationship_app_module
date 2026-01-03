import type { Result } from "@/domain/types/result";
import type { RenderError } from "../types/errors/render-error.interface";
import type { RenderEngineType } from "../types/component-descriptor.interface";
import type { IRenderEnginePort } from "./render-engine-port.interface";

/**
 * IRendererRegistry - Verwaltet Render-Engine-Implementierungen
 */
export interface IRendererRegistry {
  /**
   * Registriert einen Renderer für einen RenderEngineType.
   *
   * @param type - RenderEngineType
   * @param renderer - IRenderEnginePort Implementierung
   */
  register(type: RenderEngineType, renderer: IRenderEnginePort): void;

  /**
   * Holt einen Renderer für einen RenderEngineType.
   *
   * @param type - RenderEngineType
   * @returns Result mit Renderer oder Fehler
   */
  get(type: RenderEngineType): Result<IRenderEnginePort, RenderError>;
}
