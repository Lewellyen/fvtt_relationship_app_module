import { createInjectionToken } from "@/application/utils/token-factory";
import type { BootstrapHookService } from "@/framework/core/bootstrap/bootstrap-hook-service.interface";

/**
 * Framework-layer token for BootstrapReadyHookService.
 *
 * Kept in Framework to avoid Framework-Core importing Infrastructure token locations.
 * Infrastructure keeps a legacy alias for backward compatibility.
 */
export const frameworkBootstrapReadyHookServiceToken = createInjectionToken<BootstrapHookService>(
  "FrameworkBootstrapReadyHookService"
);
