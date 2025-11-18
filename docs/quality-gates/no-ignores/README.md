# No-Ignores-Policy

Diese Policy definiert, wo `ignore`-Marker (`v8 ignore`, `type-coverage:ignore`, `eslint-disable`, `ts-ignore`) im Code erlaubt sind und wo nicht.

## Verbotene Ignores (nie erlaubt)

In folgenden Bereichen sind **keine** `ignore`-Marker erlaubt:

- `src/core/**` (mit dokumentierten Ausnahmen, siehe unten)
- `src/services/**`
- `src/utils/**`
- `src/types/**`
- `src/di_infrastructure/**` (mit wenigen, explizit dokumentierten Ausnahmen)

**Ausnahmen in `src/core/**`:**
- `src/core/init-solid.ts` – Environment-spezifische Foundry Hooks

**Hinweis:** Die folgenden Dateien waren ursprünglich in EXCEPTIONS, wurden aber durch Tests und Helper-Funktionen vollständig behoben:
- `src/core/api/module-api-initializer.ts` – Alle Marker entfernt (durch Tests und Helper-Funktionen)
- `src/core/hooks/render-journal-directory-hook.ts` – Alle Marker entfernt (durch Tests und Helper-Funktionen)
- `src/core/module-hook-registrar.ts` – Alle Marker entfernt (durch Helper-Funktion)
- `src/core/settings/log-level-setting.ts` – Alle Marker entfernt (durch Helper-Funktion)

**Ausnahmen in `src/di_infrastructure/**`:**
- `src/di_infrastructure/container.ts` – Coverage-Tool-Limitation: finally-Block
- `src/di_infrastructure/validation/ContainerValidator.ts` – Coverage-Tool-Limitation: early return
- `src/di_infrastructure/resolution/ServiceResolver.ts` – Coverage-Tool-Limitation: optional chaining
- `src/di_infrastructure/types/runtime-safe-cast.ts` – Runtime-Casts (bereits global ignoriert)
- `src/di_infrastructure/types/serviceclass.ts` – Variadische Konstruktoren
- `src/di_infrastructure/types/api-safe-token.ts` – Nominal branding
- `src/di_infrastructure/registry/TypeSafeRegistrationMap.ts` – Heterogene Service-Typen

**Ausnahme in `src/config/**`:**
- `src/config/dependencyconfig.ts` – Coverage-Tool-Limitation: return statement

## Streng, aber mit Einzelfall-Ausnahmen

In folgenden Bereichen sind Ignores **streng kontrolliert**, aber mit begründeten Einzelfall-Ausnahmen erlaubt:

- `src/foundry/**`
- `src/observability/**`
- `src/notifications/**`

**Ausnahmen in `src/foundry/**`:**
- `src/foundry/runtime-casts.ts` – Runtime-Casts (bereits global ignoriert)
- `src/foundry/validation/schemas.ts` – `eslint-disable` für Schema-Naming (Valibot-Konvention)

**Hinweis:** `src/foundry/versioning/portregistry.ts` war ursprünglich in EXCEPTIONS, wurde aber durch Helper-Funktion `getFactoryOrError()` behoben.

**Ausnahmen in `src/observability/**`:**
- `src/observability/metrics-collector.ts` – `eslint-disable` für Interface-Definition (console.table-Kompatibilität)

## Erlaubt, aber dokumentationspflichtig

In folgenden Bereichen sind Ignores erlaubt, **müssen aber dokumentiert werden**:

- `src/svelte/**`
- `src/adapters/ui/**`
- `src/polyfills/**`

**Bedingungen:**
- Nur für direkte Interaktionen mit externer Umgebung (Browser, Foundry-UI, Canvas)
- Fälle, die durch E2E-Tests abgedeckt werden

**Beispiele:**
- `src/polyfills/cytoscape-assign-fix.ts` – Legacy polyfill, schwer testbar ohne Browser-Integration

## Test-Dateien

**Test-Dateien sind von der No-Ignores-Policy ausgenommen:**
- `**/__tests__/**`
- `*.test.ts`
- `*.spec.ts`

Ignores in Test-Dateien sind erlaubt, sollten aber sparsam verwendet werden.

## Automatisierte Überprüfung

Die Policy wird automatisch durch `scripts/check-no-ignores.mjs` überprüft:

```bash
npm run check:no-ignores
```

Das Skript:
- Sucht nach `c8 ignore`, `type-coverage:ignore`, `eslint-disable`, `ts-ignore` in verbotenen Bereichen
- Berücksichtigt dokumentierte Ausnahmen
- Gibt einen Fehler aus, wenn unberechtigte Ignores gefunden werden

## Integration in CI/Gates

Die No-Ignores-Policy ist Teil des Quality-Gate-Systems:

- `npm run check:all` führt `check:no-ignores` aus (sobald alle Teilpläne umgesetzt sind)
- `test:coverage` mit hoher/100%-Schwelle
- `type-coverage` mit 100%-Schwelle
- `lint`, `css-lint`, `format`

## Dokumentation

- **Übersicht:** `docs/quality-gates/no-ignores/00-no-ignores-overview.md`
- **Teilpläne:** `docs/quality-gates/no-ignores/01-*.md` bis `07-*.md`
- **Status-Reports:** `docs/quality-gates/no-ignores/*-status.md`
- **Master-Check:** `docs/quality-gates/no-ignores/07-master-check-status.md`

## Begründungen für Ausnahmen

Alle Ausnahmen müssen begründet sein. Typische Begründungen:

1. **Coverage-Tool-Limitationen:** c8 zählt bestimmte Code-Pfade nicht korrekt (finally-Blöcke, early returns, optional chaining)
2. **Environment-Dependent:** Code hängt von Foundry-Laufzeitumgebung ab (Hooks, Settings, Lifecycle)
3. **Runtime-Casts:** Type-Assertions für externe APIs (Foundry, Browser)
4. **Defensive Checks:** Theoretisch unmögliche Pfade, die für Type-Safety vorhanden sind
5. **Externe Konventionen:** Kompatibilität mit externen Bibliotheken (z.B. Valibot-Schemas, console.table)

## Änderungen an der Policy

Bei Änderungen an der Policy:

1. Dieses Dokument aktualisieren
2. `scripts/check-no-ignores.mjs` EXCEPTIONS aktualisieren
3. `docs/TESTING.md` aktualisieren (falls relevant)
4. `docs/quality-gates/no-ignores/07-master-check-status.md` aktualisieren

