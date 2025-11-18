# Ignore-Marker Inventur – Produktivcode

**Datum:** 2025-01-27  
**Scope:** Alle ignore-Marker im Produktivcode (`src/` ohne Test-Dateien)

## Zusammenfassung

| Kategorie | Anzahl | Status |
|-----------|--------|--------|
| `v8 ignore` | 10 | ✅ Alle dokumentiert |
| `type-coverage:ignore` | 8 | ✅ Alle dokumentiert |
| `eslint-disable` | 15 | ✅ Alle begründet |
| `@ts-ignore` / `@ts-expect-error` | 0 | ✅ Keine gefunden |

**Gesamt:** 33 ignore-Marker im Produktivcode

---

## 1. `v8 ignore` Marker (10)

### ✅ Erlaubt (in EXCEPTIONS dokumentiert)

| Datei | Zeile | Marker | Begründung |
|-------|-------|--------|------------|
| `src/core/init-solid.ts` | 36-44 | `v8 ignore start/end` | Edge case: getContainer() fails after successful bootstrap |
| `src/core/init-solid.ts` | 61-156 | `v8 ignore start/end` | Foundry-Hooks und UI-spezifische Pfade (environment-dependent) |
| `src/core/init-solid.ts` | 164-209 | `v8 ignore start/end` | Bootstrap-Fehlerpfade (Foundry-versionsabhängig) |
| `src/di_infrastructure/container.ts` | 408-411 | `v8 ignore start/end` | Coverage-Tool-Limitation: finally-Block |
| `src/di_infrastructure/validation/ContainerValidator.ts` | 194-198 | `v8 ignore start/end` | Coverage-Tool-Limitation: early return |
| `src/di_infrastructure/resolution/ServiceResolver.ts` | 120-122 | `v8 ignore start/end` | Coverage-Tool-Limitation: optional chaining |
| `src/config/dependencyconfig.ts` | 174-176 | `v8 ignore start/end` | Coverage-Tool-Limitation: return statement |

### ✅ Erlaubt (außerhalb verbotener Bereiche)

| Datei | Zeile | Marker | Begründung |
|-------|-------|--------|------------|
| `src/index.ts` | 9 | `v8 ignore file` | Entry Point mit nur Side-Effects (Imports) |
| `src/constants.ts` | 12 | `v8 ignore file` | Reine Konstanten-Definition, keine ausführbare Logik |
| `src/polyfills/cytoscape-assign-fix.ts` | 7 | `v8 ignore file` | Legacy polyfill, schwer testbar ohne Browser-Integration |

---

## 2. `type-coverage:ignore` Marker (8)

### ✅ Erlaubt (in EXCEPTIONS dokumentiert)

| Datei | Zeile | Marker | Begründung |
|-------|-------|--------|------------|
| `src/di_infrastructure/types/serviceclass.ts` | 37 | `type-coverage:ignore-next-line` | Variadische Konstruktoren: Constructor braucht `any[]` für variable Argumente während DI |
| `src/di_infrastructure/types/api-safe-token.ts` | 91 | `type-coverage:ignore-next-line` | Nominal branding: Return mit compile-time brand marker (type cast) |

### ✅ Erlaubt (außerhalb verbotener Bereiche)

| Datei | Zeile | Marker | Begründung |
|-------|-------|--------|------------|
| `src/config/environment.ts` | 94 | `type-coverage:ignore-line` | Build-time env vars (Vite import.meta.env) |
| `src/config/environment.ts` | 102 | `type-coverage:ignore-line` | Build-time env vars (Vite import.meta.env) |
| `src/config/environment.ts` | 104 | `type-coverage:ignore-line` | Build-time env vars (Vite import.meta.env) |
| `src/config/environment.ts` | 111 | `type-coverage:ignore-line` | Build-time env vars (Vite import.meta.env) |
| `src/config/environment.ts` | 113 | `type-coverage:ignore-line` | Build-time env vars (Vite import.meta.env) |
| `src/config/environment.ts` | 115 | `type-coverage:ignore-line` | Build-time env vars (Vite import.meta.env) |
| `src/interfaces/cache.ts` | 120 | `type-coverage:ignore-line` | Brand assertion required für CacheKey |

---

## 3. `eslint-disable` Marker (15)

### ✅ Erlaubt (begründet, in EXCEPTIONS oder Policy-konform)

| Datei | Zeile | Marker | Begründung |
|-------|-------|--------|------------|
| `src/observability/metrics-collector.ts` | 50 | `eslint-disable @typescript-eslint/naming-convention` | Interface-Definition für `console.table()` Kompatibilität |
| `src/observability/metrics-collector.ts` | 224 | `eslint-disable @typescript-eslint/naming-convention` | Interface-Definition für `console.table()` Kompatibilität |
| `src/foundry/validation/schemas.ts` | 23 | `eslint-disable-next-line @typescript-eslint/naming-convention` | Schemas verwenden PascalCase (Valibot-Konvention) |
| `src/foundry/validation/schemas.ts` | 157 | `eslint-disable-next-line @typescript-eslint/naming-convention` | Schemas verwenden PascalCase (Valibot-Konvention) |
| `src/foundry/validation/schemas.ts` | 288 | `eslint-disable-next-line @typescript-eslint/naming-convention` | Schemas verwenden PascalCase (Valibot-Konvention) |
| `src/di_infrastructure/registry/TypeSafeRegistrationMap.ts` | 27 | `eslint-disable-next-line @typescript-eslint/no-explicit-any` | Heterogene Service-Typen erfordern `any` Storage (in EXCEPTIONS) |
| `src/di_infrastructure/registry/TypeSafeRegistrationMap.ts` | 98 | `eslint-disable-next-line @typescript-eslint/no-explicit-any` | Heterogene Service-Typen erfordern `any` Storage (in EXCEPTIONS) |
| `src/di_infrastructure/registry/TypeSafeRegistrationMap.ts` | 111 | `eslint-disable-next-line @typescript-eslint/no-explicit-any` | Heterogene Service-Typen erfordern `any` Storage (in EXCEPTIONS) |
| `src/di_infrastructure/types/serviceclass.ts` | 36 | `eslint-disable @typescript-eslint/no-explicit-any` | Variadische Konstruktoren (in EXCEPTIONS) |
| `src/services/i18n/FallbackTranslationHandler.ts` | 26 | `eslint-disable-next-line @typescript-eslint/no-unused-vars` | Parameter für Interface-Kompatibilität |
| `src/services/i18n/LocalTranslationHandler.ts` | 21 | `eslint-disable-next-line @typescript-eslint/no-unused-vars` | Parameter für Interface-Kompatibilität |
| `src/services/i18n/FoundryTranslationHandler.ts` | 21 | `eslint-disable-next-line @typescript-eslint/no-unused-vars` | Parameter für Interface-Kompatibilität |
| `src/polyfills/cytoscape-assign-fix.ts` | 8 | `eslint-disable @typescript-eslint/no-explicit-any` | Legacy polyfill (erlaubt, dokumentationspflichtig) |
| `src/test/utils/test-helpers.ts` | 229 | `eslint-disable-next-line @typescript-eslint/no-explicit-any` | Test-Utilities (erlaubt) |
| `src/foundry/custom.d.ts` | 9 | `eslint-disable-next-line @typescript-eslint/no-deprecated` | Type-Definition für Foundry-Typen (erlaubt) |

---

## 4. `@ts-ignore` / `@ts-expect-error` Marker

✅ **Keine gefunden** in Produktionscode (nur Erwähnung in Dokumentation).

---

## 5. Kategorisierung nach Bereichen

### `src/core/**` (außer `init-solid.ts`)
✅ **Keine Marker** – Alle Marker wurden durch Tests oder Helper-Funktionen behoben

### `src/core/init-solid.ts`
- 3 `v8 ignore` Blöcke (environment-dependent Foundry Hooks)

### `src/di_infrastructure/**`
- 3 `v8 ignore` Blöcke (Coverage-Tool-Limitationen)
- 4 `eslint-disable` Marker (begründet)
- 2 `type-coverage:ignore` Marker (begründet)

### `src/foundry/**`
- 0 `v8 ignore` Blöcke (defensiver Check wurde durch Helper-Funktion behoben)
- 3 `eslint-disable` Marker (Valibot-Konvention)

### `src/config/**`
- 1 `v8 ignore` Block (Coverage-Tool-Limitation)
- 6 `type-coverage:ignore` Marker (Build-time env vars)

### `src/services/**`
- 3 `eslint-disable` Marker (Interface-Kompatibilität)

### `src/utils/**`, `src/types/**`
✅ **Keine Marker**

### `src/polyfills/**`
- 1 `v8 ignore file` Marker
- 1 `eslint-disable` Marker (Legacy polyfill)

### `src/interfaces/**`
- 1 `type-coverage:ignore` Marker (Brand assertion)

### `src/observability/**`
- 2 `eslint-disable` Marker (console.table Kompatibilität)

### `src/test/**`
- 1 `eslint-disable` Marker (Test-Utilities)

---

## 6. Policy-Konformität

### ✅ Konform

- **Verbotene Bereiche:** Keine unberechtigten Ignores gefunden
  - `src/core/**` (außer `init-solid.ts`): ✅ Keine Marker
  - `src/services/**`: ✅ Nur begründete Marker (Interface-Kompatibilität)
  - `src/utils/**`: ✅ Keine Marker
  - `src/types/**`: ✅ Keine Marker

- **Streng, aber mit Ausnahmen:** Alle Ignores in `src/foundry/**`, `src/observability/**` sind begründet und dokumentiert

- **Erlaubt, dokumentationspflichtig:** `src/polyfills/**` Ignores sind dokumentiert

### ✅ Alle Marker dokumentiert

Jeder ignore-Marker hat eine klare Begründung und ist entweder:
- In EXCEPTIONS dokumentiert
- In Policy-konformen Bereichen (außerhalb verbotener Zonen)
- Mit Kommentar begründet

---

## 7. Statistik nach Kategorien

### `v8 ignore` (10 Marker)
- In EXCEPTIONS: 7 Marker
- Außerhalb verbotener Bereiche: 3 Marker

### `type-coverage:ignore` (8 Marker)
- In EXCEPTIONS: 2 Marker
- Außerhalb verbotener Bereiche: 6 Marker

### `eslint-disable` (15 Marker)
- Begründet in EXCEPTIONS: 9 Marker
- Begründet außerhalb: 6 Marker

### `@ts-ignore` / `@ts-expect-error` (0 Marker)
- Keine gefunden

---

## 8. Vergleich mit Master-Check

**Vorher (Master-Check):**
- 4 Dateien in `src/core/**` mit 10 `c8 ignore` Markern
- Alle als "Zu prüfen" markiert

**Nachher (aktuell):**
- ✅ Alle 10 Marker behoben
- ✅ 0 Marker in `src/core/**` (außer `init-solid.ts`)
- ✅ Alle Dateien aus EXCEPTIONS entfernt

**Ergebnis:** 100% Erfolgsquote bei der Behebung der Master-Check Findings

