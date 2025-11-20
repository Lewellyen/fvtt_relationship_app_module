declare module "*.hbs" {
  import { TemplateDelegate } from "handlebars";
  const template: TemplateDelegate;
  export default template;
}

declare module "*.svelte" {
  import type { ComponentType, SvelteComponent } from "svelte";
  const component: ComponentType<SvelteComponent<Record<string, unknown>>>;
  export default component;
}

declare module "flowbite-svelte";
declare module "@sveltejs/vite-plugin-svelte";

declare module "*.css?raw" {
  const content: string;
  export default content;
}

// Vite environment types
interface ImportMetaEnv {
  readonly MODE: string;
  readonly VITE_ENABLE_PERF_TRACKING?: string;
  // Add other environment variables as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
