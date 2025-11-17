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

## 2. No-Ignores-Policy festschreiben (Whitelist-System)

Nach Abschluss aller Teilpläne wurde das No-Ignores-Check-System auf ein **Whitelist-System** umgestellt:

### Whitelist-Prinzip

- **Alle Dateien in `src/**` werden geprüft** (außer Tests und Polyfills)
- **Nur dokumentierte Dateien dürfen Marker haben**: Whitelist in `scripts/check-no-ignores.mjs`
- **Automatische Ausschlüsse**:
  - Test-Dateien (`__tests__/`, `*.test.ts`, `*.spec.ts`, `test/`)
  - Polyfills (`src/polyfills/**`)

### Whitelist-Verwaltung

Die Whitelist wird direkt im Check-Script (`scripts/check-no-ignores.mjs`) gepflegt. Jeder Eintrag enthält:
- **Datei-Pfad**: Relativer Pfad zur Datei
- **Erlaubte Marker**: Liste der erlaubten Marker-Typen
- **Begründung**: Dokumentation warum Marker notwendig sind

### Aktuelle Whitelist-Kategorien

1. **Bootstrap & Environment**: `init-solid.ts`, `index.ts`, `constants.ts`, `environment.ts`
2. **DI-Infrastruktur (Coverage-Tool-Limitationen)**: `container.ts`, `ContainerValidator.ts`, `ServiceResolver.ts`, `dependencyconfig.ts`
3. **DI-Infrastruktur (Architektonisch notwendige Typen)**: `serviceclass.ts`, `api-safe-token.ts`
4. **Runtime-Casts**: `runtime-safe-cast.ts`, `runtime-casts.ts` (bereits global in type-coverage.json ausgenommen)
5. **Polyfills**: `cytoscape-assign-fix.ts`
6. **Type-Assertions**: `cache.ts`

### Neue Marker hinzufügen

Um einen neuen Marker hinzuzufügen:
1. Datei zur Whitelist in `scripts/check-no-ignores.mjs` hinzufügen
2. Marker-Typen und Begründung dokumentieren
3. Check ausführen: `npm run check:no-ignores`

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


