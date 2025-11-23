# Teilplan 05 – UI & Adapter-Layer (Svelte, Svelte-Flow, Cytoscape)

## Scope

- `src/svelte/**`
- ggf. spätere Struktur:
  - `src/adapters/ui/**` (Svelte-/Cytoscape-/Svelte-Flow-Wrapper)
- Weitere UI-nahe Dateien (z.B. `polyfills/cytoscape-assign-fix.ts`)

Ziel: UI-nahe Logik ist soweit möglich durch Unit-/Komponententests abgedeckt. `ignore`-Stellen sind hier nur für reine „Durchreicher“ zu externen Libraries erlaubt und werden zusätzlich durch E2E-Tests abgesichert.

## Schritte

1. **Architektur-Schnitt prüfen**
   - Optionales Refactoring planen:
     - UI-spezifische Adapter (z.B. Cytoscape-Initialisierung) in `src/adapters/ui/**` auslagern.
     - Svelte-Komponenten nutzen diese Adapter nur noch über saubere Interfaces.
   - Vorteil:
     - Klare Stelle, an der Ignores (falls nötig) isoliert sitzen.

2. **Inventur in UI/Adapter-Code**
   - Alle `c8 ignore`, `type-coverage:ignore`, `eslint-disable`, `ts-ignore` in `src/svelte/**` und UI-Adaptern sammeln.
   - Pro Stelle klassifizieren:
     - Business-/Transformationslogik vs. reine Weiterleitung an externe API.

3. **Svelte-Komponenten testen**
   - Komponententests (z.B. mit `@testing-library/svelte`) für:
     - Props → gerendertes DOM.
     - Events (z.B. „Beziehung hinzugefügt“).
     - State-Handling (Filter, Auswahl von Nodes).
   - Ziel:
     - Kein `c8 ignore` für Komponentenlogik (if/else, Mapping von Props, Event-Handler).

4. **Cytoscape-/Svelte-Flow-Adapter testen**
   - Adapter-Funktionen wie `renderGraph`, `updateGraph`, `selectNode` so definieren, dass sie:
     - eine eigene TS-Schnittstelle verwenden,
     - intern nur die externe API aufrufen.
   - Unit-Tests:
     - Cytoscape/Svelte-Flow als `vi.fn()`-Mocks injizieren.
     - Prüfen, dass die Adapter die richtigen Methoden mit den richtigen Daten aufrufen.
   - Nur dort, wo der Adapter Code ausführt, der ohne echten Browser/Canvas keinen Mehrwert bringt, kann ein enger `c8 ignore` in Betracht kommen.

5. **Umgang mit Ignores in UI-Schicht**
   - `c8 ignore`:
     - Erlaubt nur für minimale Zeilen, die rein externe Calls machen (z.B. direkter Zugriff auf `window`, `ResizeObserver`, echte Cytoscape-Initialisierung).
     - Kommentar: „requires real browser environment, covered by E2E“.
   - `type-coverage:ignore`:
     - vermeiden; wenn externe Library nur `any` liefert, lieber Wrapper-Typen definieren und diese zentral nutzen.
   - `eslint-disable`/`ts-ignore`:
     - nur zulässig für spezielle Library-Inkompatibilitäten, mit Kommentar und ggf. Issue-Link.

6. **Abschluss für UI/Adapter-Layer**
   - `npm run test:coverage` mit UI-Filter (optional) ausführen.
   - Ziel:
     - UI-/Adapter-Dateien haben hohe Coverage für eigene Logik.
     - Alle verbleibenden Ignores sind bewusst, minimal, dokumentiert und werden durch E2E-Tests mit abgedeckt (siehe `06-e2e-tests.md`).


