import { MODULE_METADATA } from "@/application/constants/app-constants";
import { formatReplacementInfo } from "@/infrastructure/shared/utils/format-deprecation-info";
import type { ApiSafeToken } from "@/infrastructure/di/types/utilities/api-safe-token";
import { getDeprecationInfo } from "@/infrastructure/di/types/utilities/deprecated-token";
import type { DeprecationInfo } from "@/framework/core/api/module-api";
import type { IDeprecationHandler } from "../interfaces/api-component-interfaces";

/**
 * DeprecationHandler
 *
 * Responsible for handling deprecation warnings for tokens.
 * Separated from ModuleApiInitializer for Single Responsibility Principle.
 */
export class DeprecationHandler implements IDeprecationHandler {
  /**
   * Checks if a token is deprecated.
   *
   * @param token - Token to check
   * @returns DeprecationInfo if deprecated, null otherwise
   */
  checkDeprecation<TServiceType>(token: ApiSafeToken<TServiceType>): DeprecationInfo | null {
    return getDeprecationInfo(token) ?? null;
  }

  /**
   * Handles deprecation warnings for tokens.
   * Logs warning to console if token is deprecated and warning hasn't been shown yet.
   *
   * Uses console.warn instead of Logger because:
   * - Deprecation warnings are for external API consumers (not internal logs)
   * - Should be visible even if Logger is disabled/configured differently
   * - Follows npm/Node.js convention for deprecation warnings
   *
   * @param token - Token to check for deprecation
   */
  handleDeprecationWarning<TServiceType>(token: ApiSafeToken<TServiceType>): void {
    const deprecationInfo = getDeprecationInfo(token);
    if (deprecationInfo && !deprecationInfo.warningShown) {
      const replacementInfo = formatReplacementInfo(deprecationInfo.replacement);
      console.warn(
        `[${MODULE_METADATA.ID}] DEPRECATED: Token "${String(token)}" is deprecated.\n` +
          `Reason: ${deprecationInfo.reason}\n` +
          replacementInfo +
          `This token will be removed in version ${deprecationInfo.removedInVersion}.`
      );
      deprecationInfo.warningShown = true; // Only warn once per session
    }
  }
}
