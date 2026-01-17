import { createInjectionToken } from "@/application/utils/token-factory";

/**
 * Framework-layer injection token for ModuleApiInitializer.
 *
 * Framework-Core must not depend on Infrastructure token locations.
 * Infrastructure keeps an alias for backward compatibility.
 */
export const frameworkModuleApiInitializerToken = createInjectionToken<unknown>(
  "FrameworkModuleApiInitializer"
);
