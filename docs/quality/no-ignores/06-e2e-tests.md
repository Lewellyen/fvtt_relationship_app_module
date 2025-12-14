# Teilplan 06 – E2E-Tests (Playwright + Foundry)

## Ziel

E2E-Tests stellen sicher, dass das Modul in einer realen Foundry-Instanz inkl. UI (Svelte, Cytoscape, Svelte-Flow) erwartungsgemäß funktioniert. Sie dienen als Absicherung für UI-/Environment-Pfade, die in Unit-/Integrationstests nicht sinnvoll abbildbar sind.

## Voraussetzungen

- Lokale Foundry-Installation (bereits vorhanden).
- Testwelt, in der:
  - das Modul installiert und aktiviert ist,
  - ggf. Testdaten (Actors, Journals) vorbereitet sind.
- Fester Port, unter dem Foundry erreichbar ist (z.B. `http://localhost:30001`).

## Setup (High Level)

1. **Playwright hinzufügen**
   - `devDependency`: `@playwright/test`.
   - NPM-Skripte:
     - `test:e2e`: führt `playwright test` aus.
     - Optional: `test:e2e:headed` für visuelle Debug-Sessions.

2. **Test-Verzeichnis**
   - z.B. `tests/e2e/` mit Unterstruktur:
     - `bootstrap.spec.ts`
     - `relationships.spec.ts`
     - `notifications.spec.ts`

3. **Konfiguration**
   - Playwright-Konfig (z.B. `playwright.config.ts`):
     - Basis-URL (Foundry-URL).
     - Timeouts.
     - Browser-Typen.

## E2E-Szenarien

1. **Bootstrap-Szenario**
   - Foundry starten, Testwelt öffnen.
   - Modul-UI sichtbar und ohne JS-Error im Browser.

2. **Einfacher Beziehungsgraph**
   - UI öffnen, Relationship-Editor nutzen.
   - Zwei Entities verbinden.
   - Prüfen, dass im Graph:
     - Nodes und Edges erscheinen,
     - Labels korrekt sind.

3. **Filter/Interaktion**
   - Filter aktivieren (z.B. Beziehungsart).
   - Prüfen, dass die Visualisierung korrekt gefiltert wird.

4. **Notifications & Fehlerpfade**
   - Einen definierten Fehler provozieren (z.B. inkompatible Foundry-Version / bewusst falsche Konfiguration).
   - Prüfen:
     - `ui.notifications.error` zeigt den erwarteten Text.
     - Keine unerwarteten Browser-Console-Errors (`page.on("console")`, `page.on("pageerror")`).

## Verbindung zu Ignores

- Alle Stellen, die in Unit/Integration mit `c8 ignore` versehen werden (z.B. direkte `ui.notifications`-Calls, echte Browser-Cytoscape-Initialisierung), sollten:
  - hier explizit durch E2E-Szenarien abgedeckt sein,
  - in den jeweiligen Teilplänen referenziert werden.


