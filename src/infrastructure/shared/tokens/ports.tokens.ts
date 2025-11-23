import { createInjectionToken } from "@/infrastructure/di/tokenutilities";
import type { PlatformUIPort } from "@/domain/ports/platform-ui-port.interface";

/**
 * DI Token for PlatformUIPort.
 *
 * Platform-agnostic UI operations port.
 * Default implementation: FoundryUIAdapter (for Foundry VTT)
 */
export const platformUIPortToken = createInjectionToken<PlatformUIPort>("PlatformUIPort");
