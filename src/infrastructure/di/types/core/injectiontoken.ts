/**
 * A branded type for dependency injection tokens.
 * Uses a phantom property (`__serviceType`) to associate the token with a service type at compile time.
 * This ensures type safety: a `InjectionToken<Logger>` cannot be used where a `InjectionToken<Database>` is expected.
 *
 * @template TServiceType - The type of service this token represents
 *
 * @deprecated This file is kept for backward compatibility.
 * New code should import from "@/infrastructure/shared/di" instead.
 * This re-export allows existing Infrastructure layer code to continue working
 * while Application layer code uses the shared location to avoid DIP violations.
 */
export type { InjectionToken } from "@/infrastructure/shared/di";
