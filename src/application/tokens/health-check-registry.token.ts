import { createInjectionToken } from "@/application/utils/token-factory";
import type { PlatformHealthCheckPort } from "@/domain/ports/platform-health-check-port.interface";

/**
 * DI Token for PlatformHealthCheckPort.
 *
 * Central registry for health checks that can be dynamically registered.
 */
export const healthCheckRegistryToken =
  createInjectionToken<PlatformHealthCheckPort>("PlatformHealthCheckPort");
