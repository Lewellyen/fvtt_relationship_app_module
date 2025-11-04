import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { resolve } from "path";

export default defineConfig(() => {
  return {
    plugins: [
      svelte({
        compilerOptions: {
          runes: true
        }
      })
    ],
    // Simple alias mapping
    resolve: {
      alias: {
        cytoscape: "cytoscape/dist/cytoscape.umd.js",
        "@": resolve(__dirname, "src"),
      },
      extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.svelte', '.svelte.ts'],
      dedupe: ['svelte']
    },
    esbuild: {
      keepNames: true
    },
    build: {
      target: "es2020",
      outDir: "dist",
      assetsDir: "assets",
      sourcemap: true,
      minify: false, // Minification disabled for Foundry compatibility (keepNames not fully reliable)
      // Alternative: Use esbuild minify with keepNames in production after testing
      rollupOptions: {
        input: {
          main: resolve(__dirname, "src/index.ts"),
        },
        output: {
          // Foundry VTT erwartet eine spezifische Datei
          entryFileNames: "fvtt_relationship_app_module.js",
          chunkFileNames: "assets/[name]-[hash].js",
          assetFileNames: "assets/[name]-[hash].[ext]",
          // manualChunks darf nicht gesetzt werden, wenn inlineDynamicImports true ist
          inlineDynamicImports: true,
          // Foundry VTT IIFE Format
          format: "es",
          name: "Beziehungsnetzwerke für Foundry",
          extend: true,
          // KRITISCH: Verhindert Name-Mangling komplett
          generatedCode: {
            constBindings: false,
            objectShorthand: false
          },
          // Verhindert Verkürzung von Klassennamen
          compact: false,
          globals: {
            jquery: "$",
            handlebars: "Handlebars",
          },
        } as any,
        external: ["jquery", "handlebars"],
        // Verhindert alle Optimierungen die Namen verkürzen
        treeshake: false, // Komplett deaktiviert
      },
    },
    define: {
      // Manche UMD-Libs erwarten 'global' – mappe vorsichtshalber auf globalThis:
      global: "globalThis",
      // Falls eine Lib process.env referenziert (harmlos stubben):
      "process.env": {}
    },
    server: {
      port: 3000,
      open: false,
    },
  };
});
