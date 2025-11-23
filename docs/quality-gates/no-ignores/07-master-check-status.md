# Master-Check Status – No-Ignores-Policy

**Datum:** 2025-01-27  
**Ziel:** Vollständige Inventur aller `ignore`-Marker im Codebase und Abgleich mit der No-Ignores-Policy

## 1. Zusammenfassung

### Automatisierter Check
✅ **`scripts/check-no-ignores.mjs`** wurde ausgeführt:
- **Ergebnis:** Keine verbotenen Ignores in No-Ignores-Zonen gefunden
- **Geprüfte Bereiche:**
  - `src/core/**` (außer `init-solid.ts`)
  - `src/services/**`
  - `src/utils/**`
  - `src/types/**`
  - `src/di_infrastructure/**` (mit dokumentierten Ausnahmen)
  - `src/config/dependencyconfig.ts` (mit dokumentierter Ausnahme)
  - `src/foundry/**` (mit dokumentierten Ausnahmen)

### Manuelle Inventur
Alle `ignore`-Marker wurden manuell kategorisiert und mit der Policy abgeglichen.

## 2. Gefundene Ignore-Marker nach Kategorie

### 2.1. `c8 ignore` Marker

#### ✅ Erlaubt (in EXCEPTIONS dokumentiert)

| Datei | Zeile | Begründung |
|-------|-------|------------|
| `src/core/init-solid.ts` | 36-44, 61-156, 164-209 | Foundry-Hooks und Bootstrap-Fehlerpfade (environment-dependent) |
| `src/di_infrastructure/container.ts` | 408-411 | Coverage-Tool-Limitation: finally-Block |
| `src/di_infrastructure/validation/ContainerValidator.ts` | 194-198 | Coverage-Tool-Limitation: early return |
| `src/di_infrastructure/resolution/ServiceResolver.ts` | 120-122 | Coverage-Tool-Limitation: optional chaining |
| `src/config/dependencyconfig.ts` | 174-176 | Coverage-Tool-Limitation: return statement |
| `src/foundry/versioning/portregistry.ts` | 98-108 | Defensiver Check für Factory-Not-Found (theoretisch unmöglich) |

#### ⚠️ Zu prüfen (in `src/core/**`, nicht in EXCEPTIONS)

| Datei | Zeile | Marker | Kontext |
|-------|-------|--------|---------|
| `src/core/api/module-api-initializer.ts` | 72 | `c8 ignore next 3` | Ternary branch coverage (beide Branches getestet, Reporting-Artifact) |
| `src/core/api/module-api-initializer.ts` | 133 | `c8 ignore next 2` | `container.resolveWithError` failure path (bereits in Container-Tests abgedeckt) |
| `src/core/api/module-api-initializer.ts` | 216 | `c8 ignore next` | `isRegistered` never fails; ok check is defensive |
| `src/core/api/module-api-initializer.ts` | 228-239 | `c8 ignore start/stop` | Defensive: MetricsCollector fallback (immer registriert) |
| `src/core/api/module-api-initializer.ts` | 246-259 | `c8 ignore start/stop` | Defensive: ModuleHealthService fallback (immer registriert) |
| `src/core/hooks/render-journal-directory-hook.ts` | 34-38 | `c8 ignore start/stop` | Low-Level-Typeguard für DOM-Objekte (environment-dependent) |
| `src/core/hooks/render-journal-directory-hook.ts` | 79-95 | `c8 ignore start/stop` | Defensiver Fehlerpfad für inkompatible HTML-Formate |
| `src/core/hooks/render-journal-directory-hook.ts` | 117-121 | `c8 ignore start/stop` | `off()` call wird indirekt über HookRegistrationManager-Tests abgedeckt |
| `src/core/module-hook-registrar.ts` | 69-75 | `c8 ignore start/stop` | Lifecycle method: `disposeAll()` wird beim Module-Disable aufgerufen (nicht in Unit-Tests testbar) |
| `src/core/settings/log-level-setting.ts` | 54-62 | `c8 ignore start/stop` | `onChange` callback: Defensive validation für externes Input (erfordert Foundry Settings System) |

#### ✅ Erlaubt (außerhalb verbotener Bereiche)

| Datei | Zeile | Begründung |
|-------|-------|------------|
| `src/index.ts` | 9 | Entry Point mit nur Side-Effects (Imports) |
| `src/constants.ts` | 12 | Reine Konstanten-Definition, keine ausführbare Logik |
| `src/polyfills/cytoscape-assign-fix.ts` | 7 | Legacy polyfill, schwer testbar ohne Browser-Integration (erlaubt, dokumentationspflichtig) |

### 2.2. `type-coverage:ignore` Marker

#### ✅ Erlaubt (in EXCEPTIONS dokumentiert)

| Datei | Zeile | Begründung |
|-------|-------|------------|
| `src/di_infrastructure/types/serviceclass.ts` | 37 | Variadische Konstruktoren: Constructor braucht `any[]` für variable Argumente während DI |
| `src/di_infrastructure/types/api-safe-token.ts` | 91 | Nominal branding: Return mit compile-time brand marker (type cast) |

#### ✅ Erlaubt (außerhalb verbotener Bereiche)

| Datei | Zeile | Begründung |
|-------|-------|------------|
| `src/config/environment.ts` | 94, 102, 104, 111, 113, 115 | Build-time env vars (Vite import.meta.env) |
| `src/interfaces/cache.ts` | 120 | Brand assertion required für CacheKey |

### 2.3. `eslint-disable` Marker

#### ✅ Erlaubt (begründet, in EXCEPTIONS oder Policy-konform)

| Datei | Zeile | Marker | Begründung |
|-------|-------|--------|------------|
| `src/observability/metrics-collector.ts` | 50, 224 | `@typescript-eslint/naming-convention` | Interface-Definition für `console.table()` Kompatibilität |
| `src/foundry/validation/schemas.ts` | 23, 157, 288 | `@typescript-eslint/naming-convention` | Schemas verwenden PascalCase (Valibot-Konvention) |
| `src/di_infrastructure/registry/TypeSafeRegistrationMap.ts` | 27, 98, 111 | `@typescript-eslint/no-explicit-any` | Heterogene Service-Typen erfordern `any` Storage (in EXCEPTIONS) |
| `src/di_infrastructure/types/serviceclass.ts` | 36 | `@typescript-eslint/no-explicit-any` | Variadische Konstruktoren (in EXCEPTIONS) |
| `src/services/i18n/FallbackTranslationHandler.ts` | 26 | `@typescript-eslint/no-unused-vars` | Parameter für Interface-Kompatibilität |
| `src/services/i18n/LocalTranslationHandler.ts` | 21 | `@typescript-eslint/no-unused-vars` | Parameter für Interface-Kompatibilität |
| `src/services/i18n/FoundryTranslationHandler.ts` | 21 | `@typescript-eslint/no-unused-vars` | Parameter für Interface-Kompatibilität |
| `src/polyfills/cytoscape-assign-fix.ts` | 8 | `@typescript-eslint/no-explicit-any` | Legacy polyfill (erlaubt, dokumentationspflichtig) |

#### ✅ Erlaubt (nur in Test-Dateien)

Alle `eslint-disable` Marker in `**/__tests__/**` und `*.test.ts` Dateien sind erlaubt (Policy: Test-Dateien sind ausgenommen).

### 2.4. `@ts-ignore` Marker

✅ **Keine gefunden** in Produktionscode (nur Erwähnung in Dokumentation).

### 2.5. `@ts-expect-error` Marker

✅ **Nur in Test-Dateien:**
- `src/di_infrastructure/registry/__tests__/ServiceRegistry.test.ts` (3x)
- `src/utils/functional/__tests__/result.test.ts` (2x)

**Erlaubt:** Test-Dateien sind von der No-Ignores-Policy ausgenommen.

## 3. Bewertung der zu prüfenden `c8 ignore` Marker

### 3.1. `src/core/api/module-api-initializer.ts`

**Status:** ✅ **ERFÜLLT** – Alle Marker entfernt

**Behobene Marker:**
1. **Zeile 72:** `c8 ignore next 3` – Ternary branch coverage
   - **Lösung:** Extrahiert nach `src/utils/string/format-deprecation-info.ts` als Helper-Funktion
   - **Test:** `src/utils/string/__tests__/format-deprecation-info.test.ts` deckt beide Branches ab

2. **Zeile 133:** `c8 ignore next 2` – `container.resolveWithError` failure path
   - **Lösung:** Ignore entfernt, Test existiert bereits (Zeile 434-444 in `module-api-initializer.test.ts`)

3. **Zeile 216:** `c8 ignore next` – `isRegistered` defensive check
   - **Lösung:** Extrahiert nach `src/di_infrastructure/types/runtime-safe-cast.ts` als `getRegistrationStatus()`
   - **Test:** `src/di_infrastructure/types/__tests__/runtime-safe-cast.test.ts` deckt alle Fälle ab

4. **Zeile 228-239:** `c8 ignore start/stop` – MetricsCollector fallback
   - **Lösung:** Ignore entfernt, Test hinzugefügt (Zeile 200-218 in `module-api-initializer.test.ts`)

5. **Zeile 246-259:** `c8 ignore start/stop` – ModuleHealthService fallback
   - **Lösung:** Ignore entfernt, Test hinzugefügt (Zeile 294-309 in `module-api-initializer.test.ts`)

### 3.2. `src/core/hooks/render-journal-directory-hook.ts`

**Status:** ✅ **ERFÜLLT** – Alle Marker entfernt

**Behobene Marker:**
1. **Zeile 34-38:** `c8 ignore start/stop` – `extractHtmlElement` Typeguard
   - **Lösung:** Verschoben nach `src/foundry/runtime-casts.ts` (analog zu anderen Foundry Typeguards)
   - **Test:** `src/foundry/__tests__/runtime-casts.test.ts` deckt alle Fälle ab

2. **Zeile 79-95:** `c8 ignore start/stop` – Defensiver Fehlerpfad für inkompatible HTML-Formate
   - **Lösung:** Ignore entfernt, Test existiert bereits (Zeile 89-125 in `render-journal-directory-hook.test.ts`)

3. **Zeile 117-121:** `c8 ignore start/stop` – `off()` call
   - **Lösung:** Ignore entfernt, Test existiert bereits (Zeile 188-214 in `render-journal-directory-hook.test.ts`)

### 3.3. `src/core/module-hook-registrar.ts`

**Status:** ✅ **ERFÜLLT** – Alle Marker entfernt

**Behobene Marker:**
1. **Zeile 69-75:** `c8 ignore start/stop` – `disposeAll()` Lifecycle method
   - **Lösung:** Extrahiert nach `src/utils/hooks/dispose-hooks.ts` als Helper-Funktion
   - **Test:** `src/utils/hooks/__tests__/dispose-hooks.test.ts` deckt alle Fälle ab

### 3.4. `src/core/settings/log-level-setting.ts`

**Status:** ✅ **ERFÜLLT** – Alle Marker entfernt

**Behobene Marker:**
1. **Zeile 54-62:** `c8 ignore start/stop` – `onChange` callback
   - **Lösung:** Extrahiert nach `src/utils/settings/validate-log-level.ts` als Helper-Funktion
   - **Test:** `src/utils/settings/__tests__/validate-log-level.test.ts` deckt alle Fälle ab

## 4. Empfehlungen

### 4.1. Sofortige Aktionen

1. **EXCEPTIONS erweitern:** Die folgenden Dateien sollten zu `scripts/check-no-ignores.mjs` EXCEPTIONS hinzugefügt werden:
   - `src/core/api/module-api-initializer.ts` (defensive checks, Coverage-Tool-Limitationen)
   - `src/core/hooks/render-journal-directory-hook.ts` (environment-dependent DOM/Foundry-Hooks)
   - `src/core/module-hook-registrar.ts` (Foundry Lifecycle-Hook)
   - `src/core/settings/log-level-setting.ts` (Foundry Settings System Integration)

2. **Dokumentation aktualisieren:** Alle neuen EXCEPTIONS sollten in diesem Dokument und in `docs/TESTING.md` dokumentiert werden.

### 4.2. Optionale Verbesserungen

1. **Explizite Tests:** Für die defensiven Checks in `module-api-initializer.ts` könnten explizite Tests hinzugefügt werden, um die `c8 ignore` Marker zu entfernen (falls möglich).

2. **Policy-Dokumentation:** Die No-Ignores-Policy sollte in `docs/TESTING.md` oder `docs/quality-gates/no-ignores/README.md` festgeschrieben werden (siehe Teilplan 07, Abschnitt 2).

## 5. Policy-Konformität

### ✅ Konform

- **Verbotene Bereiche:** Keine unberechtigten Ignores gefunden (automatisierter Check bestätigt)
- **Streng, aber mit Ausnahmen:** Alle Ignores in `src/foundry/**`, `src/observability/**`, `src/notifications/**` sind begründet und dokumentiert
- **Erlaubt, dokumentationspflichtig:** `src/polyfills/**` Ignores sind dokumentiert

### ✅ Alle behoben

- **`src/core/**` (außer `init-solid.ts`):** Alle 4 Dateien sind jetzt ohne `c8 ignore` Marker
  - Alle Marker wurden durch Tests oder Helper-Funktionen behoben
  - Dateien wurden aus EXCEPTIONS entfernt

## 6. Nächste Schritte

1. ✅ **Master-Check durchgeführt** – Dieser Report
2. ✅ **Alle Marker behoben** – Tests hinzugefügt oder Helper-Funktionen extrahiert
3. ✅ **EXCEPTIONS bereinigt** – Dateien ohne Marker aus EXCEPTIONS entfernt
4. ✅ **Dokumentation aktualisiert** – Master-Check-Status zeigt ERFÜLLT für alle Dateien
5. ⏳ **CI-Integration** – `check:no-ignores` Skript in `check:all` integrieren (siehe Teilplan 07, Abschnitt 3)

## 7. Statistik

- **Gesamt gefundene `c8 ignore` Marker in `src/`:** 38
- **In EXCEPTIONS dokumentiert:** 6 Dateien (nur noch `init-solid.ts` in `src/core/**`)
- **Behoben durch Tests:** 5 Marker (3 bereits getestet, 2 mit neuen Tests)
- **Behoben durch Helper-Funktionen:** 5 Marker (alle extrahiert und getestet)
- **Erlaubt (außerhalb verbotener Bereiche):** 3 Dateien
- **Gesamt gefundene `type-coverage:ignore` Marker in `src/`:** 9
- **In EXCEPTIONS dokumentiert:** 2
- **Erlaubt (außerhalb verbotener Bereiche):** 7
- **Gesamt gefundene `eslint-disable` Marker in `src/`:** 109
- **In Produktionscode (begründet):** ~15
- **In Test-Dateien:** ~94
- **`@ts-ignore` Marker:** 0 (nur Erwähnung in Dokumentation)
- **`@ts-expect-error` Marker:** 5 (nur in Test-Dateien)

