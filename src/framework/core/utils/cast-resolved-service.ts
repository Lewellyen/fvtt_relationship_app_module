/**
 * Framework-local cast helper.
 *
 * Framework-Core must not depend on Infrastructure casting utilities.
 * The DI container guarantees type-correct registrations; this helper only restores
 * TypeScript generics at the call site.
 */
export function castResolvedService<T>(value: T): T {
  return value;
}
