<!-- Inventur-Report für Teilplan 01 – Core, Services, Utils (No Ignores, 100 %) -->

# Inventurreport – No-Ignores in core/services/utils/types

## Scope

- `src/core/**` (ohne `init-solid.ts`)
- `src/services/**`
- `src/utils/**`
- `src/types/**`

Dieser Report listet alle aktuell vorhandenen `c8 ignore`, `type-coverage:ignore`, `eslint-disable` und `ts-ignore` Direktiven im Scope auf und dient als Arbeitsgrundlage für die folgenden Schritte des Teilplans.

## Übersicht der Fundstellen

| Pfad | Zeile | Typ | Beschreibung | Einschätzung |
|------|------:|-----|--------------|-------------|
| `src/core/hooks/render-journal-directory-hook.ts` | 35–39 | c8 ignore block | Guard um `register()`-Lifecycle-Zweig | mittel |
| `src/core/hooks/render-journal-directory-hook.ts` | 81–97 | c8 ignore block | Defensive Fehlerpfade für inkompatible HTML-Formate | komplex |
| `src/core/hooks/render-journal-directory-hook.ts` | 119–123 | c8 ignore block | `off()`-Call wird indirekt über HookRegistrationManager-Tests abgedeckt | mittel |
| `src/core/module-hook-registrar.ts` | 69–75 | c8 ignore block | Lifecycle-Methode `disposeAll()`, nur bei Modul-Deaktivierung aufrufbar | mittel |
| `src/core/composition-root.ts` | 50–58 | c8 ignore block | `onComplete`-Callback für Performance Tracking (Sampling-abhängig) | mittel |
| `src/core/settings/log-level-setting.ts` | 54–62 | c8 ignore block | `onChange`-Callback für externa Log-Level-Settings | mittel |
| `src/core/api/module-api-initializer.ts` | 70 | c8 ignore next | Ternary-Branch, beide Pfade getestet; Coverage-Reporting-Artefakt | einfach |
| `src/core/api/module-api-initializer.ts` | 131 | c8 ignore next 2 | Fehlerpfad von `container.resolveWithError`, bereits in Container-Tests abgedeckt | mittel |
| `src/core/api/module-api-initializer.ts` | 223 | c8 ignore next | Defensive Branch: `isRegistered` schlägt praktisch nie fehl | mittel |
| `src/core/api/module-api-initializer.ts` | 235–246 | c8 ignore block | Defensive Pfade für fehlende MetricsCollector-Registrierung | mittel |
| `src/core/api/module-api-initializer.ts` | 253–266 | c8 ignore block | Defensive Pfade für fehlende ModuleHealthService-Registrierung | mittel |
| `src/core/api/readonly-wrapper.ts` | 17 | type-coverage:ignore-next-line | Narrowing von `(keyof T)[]` zu `string[]` | mittel |
| `src/core/api/readonly-wrapper.ts` | 52 | type-coverage:ignore-next-line | Narrowing für `allowedMethods`-Mitgliedschaft | mittel |
| `src/core/runtime-config/runtime-config.service.ts` | 65 | type-coverage:ignore-line | Map mit heterogenen Listener-Sets | mittel |
| `src/core/runtime-config/runtime-config.service.ts` | 71 | type-coverage:ignore-line | Map mit heterogenen Listener-Sets | mittel |
| `src/core/runtime-config/runtime-config.service.ts` | 86 | type-coverage:ignore-line | Map mit heterogenen Listener-Sets | mittel |
| `src/services/RetryService.ts` | 218 | type-coverage:ignore-next-line | `lastError` Non-Null-Assertion im Retry-Loop | mittel |
| `src/services/RetryService.ts` | 319 | type-coverage:ignore-next-line | `lastError` Non-Null-Assertion im Sync-Retry-Loop | mittel |
| `src/services/LocalI18nService.ts` | 45 | c8 ignore next | Nullish-Coalescing für `split()[0]`, Edge-Case | einfach |
| `src/services/CacheService.ts` | 209 | type-coverage:ignore-line | Map speichert ServiceType-Union, Rück-Cast auf Generic | mittel |
| `src/services/CacheService.ts` | 252–256 | c8 ignore block | Defensive Guard: LRU-Eintrag sollte immer gefunden werden | mittel |
| `src/services/JournalVisibilityService.ts` | 81–89 | c8 ignore block | Branch für nicht versteckte Journale; implizit über Happy Path getestet | mittel |
| `src/utils/functional/result.ts` | 238 | type-coverage:ignore-next-line | Generisches Constraint für `ThrownError` in `tryCatch` | komplex |

### Außerhalb des Scopes (nur zur Vollständigkeit)

Die folgenden Treffer liegen technisch in `src/core/**`, sind aber laut Teilplan explizit **ausgenommen** oder betreffen reine Tests und werden deshalb hier nicht bearbeitet:

- `src/core/init-solid.ts`: diverse `c8 ignore`-Blöcke für bootstrap-/Foundry-laufzeitabhängige Fehlerpfade (ausdrückliche Ausnahme im Teilplan).
- `src/core/**/__tests__/**`: `eslint-disable`-Direktiven für Test-Hilfsfälle (`any`, `ban-ts-comment`, Naming-Conventions).

## Nächste Schritte

- Für alle **c8-Ignores** im Scope: Tests so erweitern, dass alle Branches und Fehlerpfade abgedeckt sind, anschließend die Ignores entfernen.
- Für alle **type-coverage-Ignores**: Typisierung nachschärfen (Generics, Hilfstypen, Map-Wrapper), so dass die Ignores entfallen können.
- Für verbleibende **eslint-disable** im Scope (nur produktiver Code, keine Tests): Entweder den Code anpassen oder – falls externe Limitierung – sauber dokumentierte Ausnahmen definieren.


