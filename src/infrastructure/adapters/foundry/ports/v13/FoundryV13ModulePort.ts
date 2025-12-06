import type { FoundryModule } from "../../interfaces/FoundryModule";

/**
 * Foundry V13 implementation of FoundryModule.
 *
 * Uses game.modules.get(moduleId).ready to set module ready state.
 */
export class FoundryV13ModulePort implements FoundryModule {
  setModuleReady(moduleId: string): boolean {
    if (typeof game === "undefined" || !game?.modules) {
      return false;
    }

    const mod = game.modules.get(moduleId);
    if (!mod) {
      return false;
    }

    // Type assertion: ready property is defined in global.d.ts
    mod.ready = true;
    return true;
  }
}

/**
 * Factory function to create FoundryV13ModulePort instance.
 * Used by PortRegistry for dependency injection.
 */
export function createFoundryV13ModulePort(): FoundryModule {
  return new FoundryV13ModulePort();
}
