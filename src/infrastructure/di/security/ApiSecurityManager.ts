import type { InjectionToken } from "../types/core/injectiontoken";
import type { Result } from "@/domain/types/result";
import type { ContainerError } from "../interfaces";
import { isApiSafeTokenRuntime } from "../types/utilities/api-safe-token";
import { err } from "@/domain/utils/result";

/**
 * Manages API security validation for tokens.
 *
 * Responsibilities:
 * - Validates that tokens are API-safe before use in public API
 * - Enforces API boundary at runtime (defense-in-depth)
 *
 * Design:
 * - Runtime validation complements compile-time type checking
 * - Prevents misuse via type assertions or JavaScript consumers
 */
export class ApiSecurityManager {
  /**
   * Validates that a token is API-safe.
   * Used by container.resolve() to enforce API boundary.
   *
   * @param token - The token to validate
   * @returns Result indicating if token is API-safe
   */
  validateApiSafeToken<T>(token: InjectionToken<T>): Result<void, ContainerError> {
    if (!isApiSafeTokenRuntime(token)) {
      return err({
        code: "InvalidOperation",
        message:
          `API Boundary Violation: resolve() called with non-API-safe token: ${String(token)}.\n` +
          `This token was not marked via markAsApiSafe().\n` +
          `\n` +
          `Internal code MUST use resolveWithError() instead:\n` +
          `  const result = container.resolveWithError(${String(token)});\n` +
          `  if (result.ok) { /* use result.value */ }\n` +
          `\n` +
          `Only the public ModuleApi should expose resolve() for external modules.`,
        tokenDescription: String(token),
      });
    }

    return { ok: true, value: undefined } as Result<void, ContainerError>;
  }
}
