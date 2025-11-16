# Teilplan 02 – DI-Infrastruktur & Bootstrap (Container, dependencyconfig, init-solid)

## Scope

- `src/di_infrastructure/**`
- `src/config/dependencyconfig.ts`
- `src/core/composition-root.ts`
- `src/core/init-solid.ts`

Ziel: DI- und Bootstrap-Pfade (inkl. Fehlerpfade) sind weitgehend ohne Ignores abgedeckt. Kleinere Ausnahmen sind nur für echte Environment-Fälle erlaubt (z.B. UI-Notifications).

## Schritte

1. **Inventur in DI/Bootstrap**
   - Alle `c8 ignore`, `type-coverage:ignore`, `eslint-disable`, `ts-ignore` in den oben genannten Dateien identifizieren.
   - Pro Fundstelle festhalten:
     - Was ist die fachliche Verantwortung?
     - Ist die Zeile rein Environment-spezifisch (z.B. `ui.notifications`) oder fachliche Logik?

2. **DI-Infrastruktur (`src/di_infrastructure/**`)**
   - `container.ts`, Resolver, Validator, ScopeManager:
     - Für alle Ignores prüfen:
       - Können wir den Pfad über gezielte Tests nachstellen? (z.B. Timeout, Race-Condition, Already-validating).
       - Wenn ja: Test schreiben, Ignore entfernen.
       - Wenn nein:
         - Ignore auf **minimalen Bereich** beschränken.
         - Kommentar klar formulieren, warum das nur ein synthetischer Spezialfall ist.

3. **dependencyconfig (`configureDependencies`)**
   - Alle `isErr(...)`-Äste, die `err("Failed to …")` liefern, müssen direkt getestet sein.
   - Vorgehen:
     - Tests in `dependencyconfig.test.ts` erweitern oder ergänzen, sodass jeder Fehlerzweig mindestens einmal durchlaufen wird.
     - Danach `c8 ignore`-Reste entfernen oder maximal auf interne „nur weiterreichen“-Zeilen begrenzen.

4. **composition-root (`CompositionRoot.bootstrap`)**
   - Sicherstellen, dass:
     - Erfolgs- und Fehlerpfade (inkl. Logging) getestet sind.
     - Keine ungetesteten Branches verbleiben.
   - Ignores in diesem File nach Möglichkeit vollständig entfernen.

5. **init-solid (`init-solid.ts`)**
   - Fehlerpfade:
     - `root.getContainer()` liefert Fehler.
     - Logger-Auflösung schlägt fehl.
     - `Hooks` fehlt.
     - NotificationCenter/UIChannel/Hooks-Registrar/ModuleApiInitializer/SettingsRegistrar schlagen fehl.
   - Vorgehen:
     - Bestehende Tests in `init-solid.test.ts` sichten.
     - Branch-Kombinationen, die in der Coverage noch fehlen, gezielt mit weiteren Mocks abdecken.
   - Nur dort, wo wirklich nur Foundry-UI (`ui.notifications`) im Spiel ist und eine Node-Testumgebung keinen Mehrwert bringt:
     - Eng gefasstes `/* c8 ignore next -- requires real Foundry UI notifications (covered by E2E) */`.

6. **Abschluss für DI/Bootstrap**
   - `npm run check:all` ausführen.
   - Prüfen:
     - Keine unberechtigten Ignores in DI/Bootstrap.
     - Coverage der relevanten Dateien ist hoch; verbleibende Ignores sind begründet und dokumentiert.


