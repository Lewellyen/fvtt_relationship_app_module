/**
 * A branded type for dependency injection tokens.
 * Uses a phantom property (`__unknown`) to associate the token with a service type at compile time.
 * This ensures type safety: a `InjectionToken<Logger>` cannot be used where a `InjectionToken<Database>` is expected.
 *
 * @template Tunknown - The type of service this token represents
 */

export type InjectionToken<T> = symbol & {
  __serviceType?: T;
};
