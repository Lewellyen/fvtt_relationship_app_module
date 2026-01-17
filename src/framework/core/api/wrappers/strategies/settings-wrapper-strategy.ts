import type { ApiSafeToken } from "@/infrastructure/di/types/utilities/api-safe-token";
import type { ModuleApiTokens } from "@/framework/core/api/module-api";
import type { ApiWrapperStrategy } from "./api-wrapper-strategy.interface";
import type { PlatformSettingsRegistrationPort } from "@/domain/ports/platform-settings-registration-port.interface";
import { createPublicSettingsRegistrationPort } from "../../public-api-wrappers";

/**
 * SettingsWrapperStrategy
 *
 * Strategy for wrapping FoundrySettings with read-only wrapper.
 * Only allows get method, blocks register and set operations.
 */
export class SettingsWrapperStrategy implements ApiWrapperStrategy<PlatformSettingsRegistrationPort> {
  supports(
    token: ApiSafeToken<PlatformSettingsRegistrationPort>,
    wellKnownTokens: ModuleApiTokens
  ): boolean {
    return token === wellKnownTokens.platformSettingsRegistrationPortToken;
  }

  wrap(
    service: PlatformSettingsRegistrationPort,
    _token: ApiSafeToken<PlatformSettingsRegistrationPort>,
    _wellKnownTokens: ModuleApiTokens
  ): PlatformSettingsRegistrationPort {
    return createPublicSettingsRegistrationPort(service);
  }

  getPriority(): number {
    return 10; // High priority for specific token match
  }
}
