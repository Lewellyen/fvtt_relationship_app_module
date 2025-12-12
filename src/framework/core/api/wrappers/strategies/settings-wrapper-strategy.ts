import type { ApiSafeToken } from "@/infrastructure/di/types/utilities/api-safe-token";
import type { ModuleApiTokens } from "@/framework/core/api/module-api";
import type { ApiWrapperStrategy } from "./api-wrapper-strategy.interface";
import type { FoundrySettings } from "@/infrastructure/adapters/foundry/interfaces/FoundrySettings";
import { createPublicFoundrySettings } from "../../public-api-wrappers";
import { wrapFoundrySettingsPort } from "@/infrastructure/di/types/utilities/api-casts";

/**
 * SettingsWrapperStrategy
 *
 * Strategy for wrapping FoundrySettings with read-only wrapper.
 * Only allows get method, blocks register and set operations.
 */
export class SettingsWrapperStrategy implements ApiWrapperStrategy<FoundrySettings> {
  supports(token: ApiSafeToken<FoundrySettings>, wellKnownTokens: ModuleApiTokens): boolean {
    return token === wellKnownTokens.foundrySettingsToken;
  }

  wrap(
    service: FoundrySettings,
    _token: ApiSafeToken<FoundrySettings>,
    _wellKnownTokens: ModuleApiTokens
  ): FoundrySettings {
    return wrapFoundrySettingsPort(service, createPublicFoundrySettings);
  }

  getPriority(): number {
    return 10; // High priority for specific token match
  }
}
