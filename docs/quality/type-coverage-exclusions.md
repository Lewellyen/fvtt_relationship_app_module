# Type Coverage Exclusions

This document records all intentional gaps in the TypeScript type coverage report. Global exclusions are managed via `type-coverage.json` and consumed by `scripts/run-type-coverage.mjs`. Localised exceptions are documented inline with `/* type-coverage:ignore-next-line */` and summarised below.

## Global exclusions (`type-coverage.json`)

| Pattern | Reason |
| --- | --- |
| `vite.config.ts` | Build-time configuration executed by Vite/Rollup, not part of runtime module API. |
| `src/polyfills/**` | Compatibility shims that deliberately lean on `any` to patch third-party behaviour. |
| `src/test/**` | Test helpers and mocks intentionally use partial typings for flexibility. |
| `src/**/__tests__/**` & `**/*.test.ts` | Test suites assert behaviour rather than type safety. |
| `scripts/**` | Developer tooling scripts run in Node.js environments with dynamic inputs. |
| `src/custom.d.ts` | Ambient declarations describing third-party globals. |
| `src/di_infrastructure/registry/TypeSafeRegistrationMap.ts` | Type-safe Map wrapper for heterogeneous service types. Uses `ServiceRegistration<any>` storage pattern with token-based type narrowing. |

## Inline justifications

| Location | Justification |
| --- | --- |
| `src/utils/functional/result.ts` (1 cast) | Type constraint: Coerce unknown error payloads into an `Error` instance when a mapper is not provided. |
| `src/di_infrastructure/types/api-safe-token.ts` (1 cast) | Nominal branding: Apply nominal brand marker to trusted API tokens. |
| `src/di_infrastructure/types/serviceclass.ts` (1 cast) | Variadic constructor: Permit variadic constructor signatures for DI class factories. |
| `src/di_infrastructure/cache/InstanceCache.ts` (1 cast) | Type narrowing: Map type erasure - narrow cache retrievals back to the generic service type. |
| `src/di_infrastructure/resolution/ServiceResolver.ts` (2 casts) | Type narrowing: Cache lookups require cast due to Map type erasure (Singleton and Scoped lifecycle). |
| `src/foundry/ports/v13/FoundryDocumentPort.ts` (1 cast) | Runtime type check: Error handler ensures FoundryError structure before cast. |
| `src/foundry/ports/v13/FoundrySettingsPort.ts` (4 casts) | 1-3) Type widening: fvtt-types restrictive definition for dynamic module namespaces (3×). 4) Runtime type check: Error handler ensures FoundryError structure. |
| `src/di_infrastructure/registry/ServiceRegistry.ts` (1 cast) | Type narrowing: Map.entries() loses generic type information during iteration. |
| `src/foundry/services/FoundryServiceBase.ts` (1 cast) | Type narrowing: Double cast narrows from generic ServiceType to Disposable at runtime. |
| `src/di_infrastructure/container.ts` (1 cast) | Type cast: Invoke registered fallback factory with the target service type. |
| `src/core/api/module-api-initializer.ts` (8 casts) | Generic type narrowing: Token comparison guarantees service type, but TypeScript cannot infer `TServiceType` from runtime checks. |
| `src/infrastructure/adapters/foundry/versioning/portselector.ts` (1 cast) | Generic type narrowing: selectedToken kommt aus tokens Map<number, InjectionToken<T>>, aber Strategy ist als PortMatchStrategy<unknown> typisiert für Flexibilität. TypeScript kann den generischen Typ nicht ableiten, obwohl der Token zur Laufzeit vom Typ InjectionToken<T> ist. |
| `src/foundry/versioning/portregistry.ts` (2 assertions) | Non-null assertions: Array[0] and Map.get() guaranteed by length and compatibleVersions checks. |
| `src/services/RetryService.ts` (2 assertions) | Non-null assertions: lastError guaranteed defined after loop (maxAttempts >= 1). |
| `src/core/api/readonly-wrapper.ts` (2 casts) | 1) Type narrowing: (keyof T)[] to string[] safe when T uses string keys. 2) Proxy trap: prop to keyof T after allowedMethods membership check. |
| `src/foundry/facades/foundry-journal-facade.ts` (1 cast) | Type widening: fvtt-types restrictive scope type ("core" only), cast necessary for module flags with module ID scope. |

Each inline exclusion is paired with a descriptive comment in code referencing the invariant that justifies the cast or assertion. Automated tests covering these paths are located beside the relevant modules (e.g. `PortSelector.test.ts`, `FoundryHooksService.test.ts`, `RetryService.test.ts`).

**Total:** 30 inline exclusions across 16 files, all documented with justifications inline using `/* type-coverage:ignore-next-line -- reason */` format.

**Eliminiert in früheren Releases:**
- ✅ jQuery compatibility casts (2) - jQuery support removed
- ✅ Test dummy service casts (2) - `createDummyService()` helper created
- ✅ RetryService NonNull assertions (4) - Early return pattern + required mapException
- ✅ FoundryServiceBase dispose cast (1) - All port interfaces extend Disposable

**Eliminiert in diesem Release (Type Coverage Refactoring):**
- ✅ Non-null assertions (6): FoundryHooksService, ServiceRegistry, versiondetector, trace, portregistry, metrics-collector
  - Direkter Wertezugriff statt Map.get()! oder Array[i]!
  - Optional chaining und Array.at(-1)
- ✅ Type Guards (1): schemas.ts eliminiert
  - `isStringValue()` Type Guard (readonly-wrapper.ts: Type Predicate musste zu boolean werden, 1 Cast zurück)
- ✅ DI-System Generic Type-Safety (4): ServiceResolver alias, factory, class, value instantiation
  - ServiceRegistration<TServiceType> generic
  - TypeSafeRegistrationMap für type-safe token-based lookup
  - Token-Generic propagiert durch Registration/Resolution Pipeline
- **Total eliminiert netto: 11 Casts** (6 + 1 + 4), 1 neuer Cast in readonly-wrapper für Type Predicate-Fix

---

## Documentation Standard

All `type-coverage:ignore` comments follow this format:

```typescript
/* type-coverage:ignore-next-line -- Specific reason for type narrowing/cast */
const narrowed = value as SpecificType;
```

**Rules:**
1. ✅ Every ignore must have a comment explaining the type narrowing
2. ✅ Comment must reference the runtime invariant that makes the cast safe
3. ✅ Comment must be inline (directly above the ignored line)
4. ✅ Prefer type guards over casts when possible

---

## Verification

To audit all type coverage exceptions:

```bash
# Find all type-coverage:ignore comments
grep -r "type-coverage:ignore" src/

# Find undocumented exceptions (should return 0)
grep -r "type-coverage:ignore-next-line$" src/
```

**Status:** ✅ All inline exceptions are documented. Zero undocumented exceptions exist.

---

## Running type coverage

Use the helper script to execute type coverage with the shared config:

```bash
npm run type-coverage
```

The script reads `type-coverage.json`, forwards the ignore patterns to `type-coverage`, and enforces 100% type coverage.

**Current Status:** ✅ 100.00% (9429 / 9429)

---

## Related Documentation

- **Quality Gates Overview:** `docs/quality-gates/README.md`
- **Code Coverage Exclusions:** `docs/quality-gates/code-coverage-exclusions.md`
- **Linter Exclusions:** `docs/quality-gates/linter-exclusions.md`
- **Testing Guide:** `docs/TESTING.md`
