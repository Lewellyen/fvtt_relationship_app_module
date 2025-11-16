# No-Ignores-Masterplan – Übersicht

Dieses Dokument beschreibt den übergeordneten Plan, alle `ignore`-Stellen (Coverage, Typen, Linter) systematisch abzubauen.

## Ziele

- **Core/Business-Code**: Keine `c8 ignore`, keine `type-coverage:ignore`, keine `eslint-disable`/`ts-ignore`.
- **Adapter/Umgebungs-Code**: Nur dort, wo wirklich nur externe Infrastruktur angefasst wird, gezielte, dokumentierte Ausnahmen (idealerweise zusätzlich via E2E getestet).
- **Testpyramide**:
  - Unit-Tests: 100 % Coverage, harte Gates.
  - Integrationstests: Zusammenspiel der Module, so weit sinnvoll ohne Ignores.
  - E2E-Tests: End-to-End gegen laufende Foundry-Instanz für UI-/Environment-Fälle.

## Arbeitsphasen (Teilpläne)

Jeder Teilbereich hat einen eigenen Plan:

- `01-core-services-utils.md`
- `02-di-bootstrap.md`
- `03-foundry-adapters.md`
- `04-observability-notifications.md`
- `05-ui-adapter-layer.md`
- `06-e2e-tests.md`
- `07-master-check-and-policy.md`

Die Dateien werden nacheinander oder in kleinen Batches abgearbeitet. Nach Abschluss aller Teilpläne wird ein Master-Check (siehe `07-master-check-and-policy.md`) ausgeführt, um verbliebene Ignores aufzuspüren.


