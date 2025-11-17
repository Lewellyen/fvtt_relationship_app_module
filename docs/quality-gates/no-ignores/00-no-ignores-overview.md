# No-Ignores-Masterplan – Übersicht

Dieses Dokument beschreibt den übergeordneten Plan, alle `ignore`-Stellen (Coverage, Typen, Linter) systematisch abzubauen.

## Ziele

- **Core/Business-Code**: Keine `c8 ignore`, keine `type-coverage:ignore`, keine `eslint-disable`/`ts-ignore`.
- **Adapter/Umgebungs-Code**: Nur dort, wo wirklich nur externe Infrastruktur angefasst wird, gezielte, dokumentierte Ausnahmen (idealerweise zusätzlich via E2E getestet).
- **Testpyramide**:
  - Unit-Tests: 100 % Coverage, harte Gates.
  - Integrationstests: Zusammenspiel der Module, so weit sinnvoll ohne Ignores.
  - E2E-Tests: End-to-End gegen laufende Foundry-Instanz für UI-/Environment-Fälle.

## Whitelist-System

Nach Abschluss der breitflächigen Elimination von Ignore-Markern wurde das No-Ignores-Check-System auf ein **Whitelist-System** umgestellt:

### Funktionsweise

- **Alle Dateien in `src/**` werden geprüft** (außer Tests und Polyfills)
- **Nur dokumentierte Dateien dürfen Marker haben**: Whitelist in `scripts/check-no-ignores.mjs`
- **Automatische Ausschlüsse**:
  - Test-Dateien (`__tests__/`, `*.test.ts`, `*.spec.ts`, `test/`)
  - Polyfills (`src/polyfills/**`)
- **Whitelist-Einträge** müssen dokumentiert sein mit:
  - Welche Marker-Typen erlaubt sind
  - Begründung warum Marker notwendig sind

### Whitelist-Verwaltung

Die Whitelist wird in `scripts/check-no-ignores.mjs` gepflegt. Jeder Eintrag enthält:
- **Datei-Pfad**: Relativer Pfad zur Datei
- **Erlaubte Marker**: Liste der erlaubten Marker-Typen (z.B. `['c8 ignore', 'type-coverage:ignore-line']`)
- **Begründung**: Dokumentation warum Marker notwendig sind

### Ausführen des Checks

```bash
npm run check:no-ignores
```

Der Check ist automatisch in `check-all` und `check:all` integriert.

## Arbeitsphasen (Teilpläne)

Jeder Teilbereich hat einen eigenen Plan:

- `01-core-services-utils.md`
- `02-di-bootstrap.md`
- `03-foundry-adapters.md`
- `04-observability-notifications.md`
- `05-ui-adapter-layer.md`
- `06-e2e-tests.md`
- `07-master-check-and-policy.md`

Die Dateien wurden nacheinander oder in kleinen Batches abgearbeitet. Nach Abschluss aller Teilpläne wurde das Master-Check-System auf ein Whitelist-System umgestellt (siehe `07-master-check-and-policy.md`).


