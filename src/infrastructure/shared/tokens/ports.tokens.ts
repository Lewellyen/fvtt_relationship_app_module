import { createInjectionToken } from "@/infrastructure/di/tokenutilities";
import type { PlatformUIPort } from "@/domain/ports/platform-ui-port.interface";
import type { PlatformSettingsPort } from "@/domain/ports/platform-settings-port.interface";

/**
 * DI Token for PlatformUIPort.
 *
 * Platform-agnostic UI operations port.
 * Default implementation: FoundryUIAdapter (for Foundry VTT)
 */
export const platformUIPortToken = createInjectionToken<PlatformUIPort>("PlatformUIPort");

/**
 * DI Token for PlatformSettingsPort.
 *
 * Platform-agnostic settings port.
 * Default implementation: FoundrySettingsAdapter (for Foundry VTT)
 */
export const platformSettingsPortToken =
  createInjectionToken<PlatformSettingsPort>("PlatformSettingsPort");
