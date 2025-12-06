import type {
  PlatformBootstrapEventPort,
  PlatformBootstrapEventError,
} from "@/domain/ports/platform-bootstrap-event-port.interface";
import type { Result } from "@/domain/types/result";
import { ok, err } from "@/domain/utils/result";

/**
 * Foundry-specific adapter for PlatformBootstrapEventPort.
 *
 * CRITICAL: This adapter uses direct Hooks.on() instead of the versioned
 * FoundryHooksService to avoid a chicken-egg problem. The PlatformEventPort
 * system requires version detection (game.version), but game.version might
 * not be available before the init event runs.
 *
 * This is a documented exception to the normal DIP pattern. All other events
 * (registered inside init) should use PlatformEventPort normally.
 */
export class FoundryBootstrapEventAdapter implements PlatformBootstrapEventPort {
  onInit(callback: () => void): Result<void, PlatformBootstrapEventError> {
    if (typeof Hooks === "undefined") {
      return err({
        code: "PLATFORM_NOT_AVAILABLE",
        message: "Foundry Hooks API not available",
      });
    }

    try {
      Hooks.on("init", callback);
      return ok(undefined);
    } catch (error) {
      return err({
        code: "EVENT_REGISTRATION_FAILED",
        message: `Failed to register init event: ${error instanceof Error ? error.message : String(error)}`,
        details: error,
      });
    }
  }

  onReady(callback: () => void): Result<void, PlatformBootstrapEventError> {
    if (typeof Hooks === "undefined") {
      return err({
        code: "PLATFORM_NOT_AVAILABLE",
        message: "Foundry Hooks API not available",
      });
    }

    try {
      Hooks.on("ready", callback);
      return ok(undefined);
    } catch (error) {
      return err({
        code: "EVENT_REGISTRATION_FAILED",
        message: `Failed to register ready event: ${error instanceof Error ? error.message : String(error)}`,
        details: error,
      });
    }
  }
}

/**
 * DI wrapper for FoundryBootstrapEventAdapter.
 * No dependencies - uses global Foundry Hooks API directly.
 */
export class DIFoundryBootstrapEventAdapter extends FoundryBootstrapEventAdapter {
  static dependencies = [] as const;
}
