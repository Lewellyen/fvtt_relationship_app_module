import type { InjectionToken } from "@/application/di/injection-token";
import { createInjectionToken } from "@/application/di/token-factory";

/**
 * Creates an injection token whose generic type is intentionally `any`.
 *
 * Rationale:
 * - Many token definition files are simple "namespaces" of DI tokens and do not want to import
 *   concrete service types (to avoid cycles / layering bleed).
 * - Using `any` here is intentional: call sites should apply type safety by using
 *   `resolveWithError<T>(token)` or by assigning the resolved value to a typed variable.
 * - We centralize the `any` + ESLint exception in ONE boundary file to avoid marker sprawl.
 */
/* eslint-disable @typescript-eslint/no-explicit-any -- DI boundary: token definitions intentionally avoid importing concrete service types */
export function createUnsafeInjectionToken(description: string): InjectionToken<any> {
  return createInjectionToken<any>(description);
}
/* eslint-enable @typescript-eslint/no-explicit-any */
