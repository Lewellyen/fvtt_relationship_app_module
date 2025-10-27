// TypeInjectionToken.ts: Type for Injection Tokens
/**
 * A branded type for dependency injection tokens.
 * Uses a phantom property (`__serviceType`) to associate the token with a service type at compile time.
 * This ensures type safety: a `InjectionToken<Logger>` cannot be used where a `InjectionToken<Database>` is expected.
 * 
 * @template TServiceType - The type of service this token represents
 */
import type { ServiceType } from "@/types/servicetypeindex";

export type InjectionToken<TServiceType extends ServiceType> = symbol & { __serviceType?: TServiceType };