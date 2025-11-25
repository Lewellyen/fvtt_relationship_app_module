import type {
  BootstrapHooksPort,
  BootstrapHookError,
} from "@/domain/ports/bootstrap-hooks-port.interface";
import type { Result } from "@/domain/types/result";
import { ok, err } from "@/infrastructure/shared/utils/result";

/**
 * Foundry-specific adapter for BootstrapHooksPort.
 *
 * CRITICAL: This adapter uses direct Hooks.on() instead of the versioned
 * FoundryHooksService to avoid a chicken-egg problem. The PlatformEventPort
 * system requires version detection (game.version), but game.version might
 * not be available before the init hook runs.
 *
 * This is a documented exception to the normal DIP pattern. All other hooks
 * (registered inside init) should use PlatformEventPort normally.
 */
export class FoundryBootstrapHooksAdapter implements BootstrapHooksPort {
  onInit(callback: () => void): Result<void, BootstrapHookError> {
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
        code: "HOOK_REGISTRATION_FAILED",
        message: `Failed to register init hook: ${error instanceof Error ? error.message : String(error)}`,
        details: error,
      });
    }
  }

  onReady(callback: () => void): Result<void, BootstrapHookError> {
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
        code: "HOOK_REGISTRATION_FAILED",
        message: `Failed to register ready hook: ${error instanceof Error ? error.message : String(error)}`,
        details: error,
      });
    }
  }
}

/**
 * DI wrapper for FoundryBootstrapHooksAdapter.
 * No dependencies - uses global Foundry Hooks API directly.
 */
export class DIFoundryBootstrapHooksAdapter extends FoundryBootstrapHooksAdapter {
  static dependencies = [] as const;
}
