# Teilplan 07 – Master-Check & No-Ignores-Policy

## Ziel

Nach Abarbeitung der Teilpläne 01–06 sicherstellen, dass:

- keine unberechtigten Ignores im Code verbleiben,
- die No-Ignores-Policy klar dokumentiert und automatisiert überprüfbar ist.

## 1. Master-Check: Rest-Ignores finden

1. Alle `ignore`-Marker per Skript suchen:
   - `c8 ignore`
   - `type-coverage:ignore`
   - `eslint-disable`
   - `ts-ignore`
2. Ergebnisse mit den abgearbeiteten Teilplänen abgleichen:
   - Ist die Stelle bereits bewertet (bewusst erlaubt)?
   - Falls nicht: nachziehen – entweder testen/entfernen oder begründet in einen „erlaubten Bereich“ verschieben.

Optional: kleines Node-Skript oder NPM-Skript, das bei `npm run check:all` läuft und Ignores außerhalb der erlaubten Bereiche als Fehler meldet.

## 2. No-Ignores-Policy festschreiben

In `docs/TESTING.md` oder einem dedizierten Dokument (z.B. `docs/quality-gates/no-ignores/README.md`):

- **Verbotene Ignores (nie erlaubt):**
  - `src/core/**`
  - `src/services/**`
  - `src/utils/**`
  - `src/types/**`
  - `src/di_infrastructure/**` (mit wenigen, explizit dokumentierten Ausnahmen).
- **Streng, aber mit Einzelfall-Ausnahmen:**
  - `src/foundry/**`
  - `src/observability/**`
  - `src/notifications/**`
- **Erlaubt, aber dokumentationspflichtig:**
  - `src/svelte/**`, `src/adapters/ui/**`, `src/polyfills/**`
  - Nur für:
    - direkte Interaktionen mit externer Umgebung (Browser, Foundry-UI, Canvas),
    - Fälle, die durch E2E-Tests abgedeckt werden.

## 3. Verbindung zu CI/Gates

- `npm run check:all` bleibt das zentrale Gate:
  - `test:coverage` mit hoher/100 %-Schwelle.
  - `type-coverage` mit 100 %-Schwelle.
  - `lint`, `css-lint`, `format`.
- Ergänzend:
  - NPM-Skript `check:no-ignores`, das:
    - verbotene Ignores per `rg` sucht,
    - bei Fund mit non-zero Exitcode abbricht.
  - Dieses Skript kann an `check:all` angehängt werden, sobald alle Teilpläne umgesetzt sind.


