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

## Inline justifications

| Location | Justification |
| --- | --- |
| `src/utils/result.ts` (`getOrThrow`) | Coerce unknown error payloads into an `Error` instance when a mapper is not provided. |
| `src/foundry/versioning/versiondetector.ts` | Regex guarantees capture group before parsing into a number. |
| `src/observability/metrics-collector.ts` | Non-null assertion on circular buffer entries after bounds check. |
| `src/foundry/validation/schemas.ts` | Narrow validated configuration objects and union fields to domain-specific shapes. |
| `src/services/JournalVisibilityService.ts` | Narrow dynamic Foundry document objects to expose `getFlag`. |
| `src/di_infrastructure/types/api-safe-token.ts` | Apply nominal brand marker to trusted API tokens. |
| `src/di_infrastructure/types/serviceclass.ts` | Permit variadic constructor signatures for DI class factories. |
| `src/di_infrastructure/cache/InstanceCache.ts` | Narrow cache retrievals back to the generic service type. |
| `src/di_infrastructure/resolution/ServiceResolver.ts` | Cast cache lookups, alias targets, factories, and registration values to the resolved generic type after validation. |
| `src/foundry/services/FoundryHooksService.ts` | Access hook maps created earlier in the control flow. |
| `src/foundry/ports/v13/FoundryDocumentPort.ts` | Translate Foundry flag lookups into strongly typed return values. |
| `src/foundry/ports/v13/FoundrySettingsPort.ts` | Interact with dynamic Foundry settings API signatures across product versions. |
| `src/utils/retry.ts` | Preserve backwards-compatible `mapException` contracts for legacy consumers. |
| `src/utils/trace.ts` | Non-null assert after ensuring trace ID segments exist. |
| `src/di_infrastructure/scope/ScopeManager.ts` | Treat instances as partially `Disposable`/`AsyncDisposable` for feature detection. |
| `src/di_infrastructure/registry/ServiceRegistry.ts` | Access lifecycle lookup sets that were initialised earlier. |
| `src/foundry/services/*Service.ts` (`dispose`) | Downcast ports to the `Disposable` interface when present. |
| `src/core/module-hook-registrar.ts` | Treat jQuery-like objects as indexable when extracting DOM nodes. |
| `src/foundry/versioning/portregistry.ts` | Read highest registered version after sorting non-empty arrays. |
| `src/di_infrastructure/container.ts` | Invoke registered fallback factory with the target service type. |
| `src/core/api/module-api-initializer.ts` (4 casts) | Generic type narrowing: Token comparison guarantees service type, but TypeScript cannot infer `TServiceType` from runtime checks. |
| `src/core/api/readonly-wrapper.ts` (1 cast) | Proxy trap: `prop` (string \| symbol) must be narrowed to `keyof T` for `includes()` check. |

Each inline exclusion is paired with a descriptive comment in code referencing the invariant that justifies the cast or assertion. Automated tests covering these paths are located beside the relevant modules (e.g. `PortSelector.test.ts`, `FoundryHooksService.test.ts`, `retry.test.ts`).

## Running type coverage

Use the helper script to execute type coverage with the shared config:

```
node ./scripts/run-type-coverage.mjs --detail --strict
```

The script reads `type-coverage.json`, forwards the ignore patterns to `type-coverage`, and enforces 100% type coverage.

