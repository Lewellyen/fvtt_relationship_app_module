/**
 * Global type augmentations for Foundry VTT.
 *
 * The base Foundry types are provided by the fvtt-types package which is
 * automatically imported in tsconfig.json. This file can be used to augment
 * or extend specific types as needed for this module.
 *
 * @see {@link https://github.com/League-of-Foundry-Developers/foundry-vtt-types}
 */

// Import Foundry VTT types (provided by fvtt-types package)
import "fvtt-types";
import type { ModuleApi } from "@/core/module-api";

declare global {
  /**
   * Augment the Foundry Module type to include our custom API.
   * This allows type-safe access to game.modules.get(MODULE_ID).api
   */
  namespace foundry {
    namespace packages {
      interface Module {
        /**
         * Optional custom API exposed by modules.
         * Our module exposes a resolve() method for external DI access.
         */
        api?: ModuleApi;
      }
    }
  }
}

// Export for module augmentation
export {};
