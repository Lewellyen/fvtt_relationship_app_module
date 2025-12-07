import { createInjectionToken } from "@/application/utils/token-factory";
import type { PlatformRuntimeConfigPort } from "@/domain/ports/platform-runtime-config-port.interface";

/**
 * DI Token for PlatformRuntimeConfigPort.
 *
 * Provides access to the merged configuration layer that combines build-time
 * environment defaults with runtime platform settings.
 */
export const runtimeConfigToken = createInjectionToken<PlatformRuntimeConfigPort>(
  "PlatformRuntimeConfigPort"
);
