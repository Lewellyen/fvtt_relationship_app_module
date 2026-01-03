/**
 * ComponentDescriptor - Beschreibt eine UI-Komponente und ihre Render-Engine
 */
export interface ComponentDescriptor {
  readonly type: RenderEngineType;
  readonly component: unknown; // Render-engine-spezifisch
  readonly props?: Record<string, unknown>; // Statische Props
  readonly wrapper?: ComponentWrapperConfig;
}

/**
 * RenderEngineType - Unterstützte Render-Engines
 */
export type RenderEngineType = "svelte" | "react" | "vue" | "handlebars";

/**
 * ComponentWrapperConfig - Konfiguration für Component-Wrapper
 */
export interface ComponentWrapperConfig {
  readonly errorBoundary?: boolean;
  readonly loadingState?: boolean;
  readonly containerClass?: string;
}
