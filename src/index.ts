/**
 * Main entry point for the Foundry VTT Relationship App Module.
 *
 * This file:
 * - Applies polyfills for third-party libraries
 * - Initializes the module
 * - Imports required CSS styles
 */
/* v8 ignore file -- Entry Point mit nur Side-Effects (Imports) -- @preserve */
import "@/polyfills/cytoscape-assign-fix";
import "@/core/init-solid";
import "../styles/tailwind.css";
// TODO (docs/roadmaps/ROADMAP-2025-11.md#1-ui-styles-reaktivierung): Re-enable UI style imports once the Svelte-based network UI is shipped.
// import "@xyflow/svelte/dist/style.css";
