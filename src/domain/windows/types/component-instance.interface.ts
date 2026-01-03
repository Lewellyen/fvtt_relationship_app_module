import type { RenderEngineType } from "./component-descriptor.interface";

/**
 * ComponentInstance - Discriminated Union für engine-spezifische Instances
 */
export type ComponentInstance =
  | SvelteComponentInstance
  | ReactComponentInstance
  | VueComponentInstance
  | HandlebarsComponentInstance;

/**
 * BaseComponentInstance - Basis-Interface für alle Component-Instances
 */
export interface BaseComponentInstance {
  readonly id: string;
  readonly type: RenderEngineType;
  readonly element: HTMLElement;
  readonly props: Readonly<Record<string, unknown>>;
}

/**
 * SvelteComponentInstance - Svelte-spezifische Component-Instance
 */
export interface SvelteComponentInstance extends BaseComponentInstance {
  readonly type: "svelte";
  readonly instance: SvelteComponent; // Svelte-spezifisch
}

/**
 * ReactComponentInstance - React-spezifische Component-Instance
 */
export interface ReactComponentInstance extends BaseComponentInstance {
  readonly type: "react";
  readonly root: ReactRoot; // React-spezifisch
}

/**
 * VueComponentInstance - Vue-spezifische Component-Instance
 */
export interface VueComponentInstance extends BaseComponentInstance {
  readonly type: "vue";
  readonly app: VueApp; // Vue-spezifisch
}

/**
 * HandlebarsComponentInstance - Handlebars-spezifische Component-Instance
 */
export interface HandlebarsComponentInstance extends BaseComponentInstance {
  readonly type: "handlebars";
  readonly template: HandlebarsTemplate; // Handlebars-spezifisch
}

// Type declarations für externe Libraries (werden durch Imports aufgelöst)
// In Svelte 5: mount() returns an object with component exports and potentially props (if accessors: true)
// For our use case, we just need to store it for unmount()
declare type SvelteComponent = Record<string, unknown>;

declare class ReactRoot {
  unmount(): void;
}

declare class VueApp {
  unmount(): void;
}

declare type HandlebarsTemplate = unknown;
