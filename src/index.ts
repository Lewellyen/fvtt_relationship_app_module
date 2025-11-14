/**
 * Main entry point for the Foundry VTT Relationship App Module.
 *
 * This file:
 * - Applies polyfills for third-party libraries
 * - Initializes the module
 * - Imports required CSS styles
 */
/* c8 ignore file -- Entry Point mit nur Side-Effects (Imports) */
import "@/polyfills/cytoscape-assign-fix";
import "@/core/init-solid";
import "../styles/tailwind.css";
// TODO: Re-enable UI style imports once the Svelte-based network UI is shipped.
// import "@xyflow/svelte/dist/style.css";
