import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/vite-plugin-svelte').UserConfig} */
export default {
  // Preprocessing: Transforms Svelte components before compilation
  // vitePreprocess enables TypeScript, PostCSS, SCSS support
  preprocess: vitePreprocess(),

  // Compiler options: Control how Svelte compiles components
  compilerOptions: {
    // Development mode (automatically set by Vite, but can be overridden)
    // dev: false,

    // Generate source maps for better debugging
    // enableSourcemap: true,

    // CSS handling
    // css: 'injected', // Options: 'injected' (default), 'external', 'none'

    // Hot Module Replacement (Svelte 5+)
    // hmr: true, // Default: true in dev, false in production

    // Hydratable: Generate code for client-side hydration (SSR)
    // hydratable: false,

    // Immutable: Assume all data is immutable (performance optimization)
    // immutable: false,

    // Legacy: Support IE11 (not recommended for modern projects)
    // legacy: false,

    // Accessibility warnings
    // a11y: {
    //   // Warn about accessibility issues
    //   enabled: true,
    //   // Specific checks to disable
    //   // missingLabels: false,
    //   // ariaHidden: false,
    // },

    // Custom element mode (Web Components)
    // customElement: false,

    // Namespace for custom elements
    // namespace: 'svg',

    // Tag name for custom elements
    // tag: null,
  },

  // Warnings configuration
  onwarn: (warning, handler) => {
    // Suppress specific warnings
    // Example: Ignore unused CSS selector warnings
    // if (warning.code === 'css-unused-selector') return;
    
    // Example: Ignore a11y warnings for specific cases
    // if (warning.code === 'a11y-click-events-have-key-events') return;
    
    // Let Svelte handle all other warnings normally
    handler(warning);
  },

  // Experimental features (use with caution)
  // experimental: {
  //   // Enable reactive statements in module context
  //   // reactiveModuleContext: false,
  // },

  // Vite-specific options
  vitePlugin: {
    // Exclude files from being processed by Svelte plugin
    // exclude: ['**/node_modules/**'],
    
    // Include additional file patterns
    // include: ['**/*.svelte'],
    
    // Emit CSS as separate files
    // emitCss: true,
    
    // Inspector: Enable Svelte Inspector in dev mode
    // inspector: {
    //   toggleKeyCombo: 'meta-shift',
    //   showToggleButton: 'always',
    //   toggleButtonPos: 'bottom-right',
    // },
  },
};

