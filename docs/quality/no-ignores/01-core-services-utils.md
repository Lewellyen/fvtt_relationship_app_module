# Teilplan 01 – Core, Services, Utils (No Ignores, 100 %)

## Scope

- `src/core/**` (ohne `init-solid.ts`)
- `src/services/**`
- `src/utils/**`
- `src/types/**`

Ziel: In diesen Bereichen dürfen keine `c8 ignore`, `type-coverage:ignore` oder generischen Linter-/TS-Ignores verbleiben.

## Schritte

1. **Inventur für diesen Bereich**
   - Per `rg` o.Ä. alle Vorkommen sammeln:
     - `c8 ignore`
     - `type-coverage:ignore`
     - `eslint-disable`, `ts-ignore`
   - Nur Treffer innerhalb der oben genannten Verzeichnisse betrachten.

2. **c8 ignore abbauen**
   - Für jede Fundstelle:
     - Ignore entfernen.
     - Unit-Test ergänzen oder erweitern, um:
       - alle Fehlerpfade (`err(...)`) zu triggern,
       - alle Branches (`if`, `else`, Guards) abzudecken.
   - Nach jedem Batch:
     - `npm run test:coverage`
     - Sicherstellen, dass betroffene Dateien 100 % Coverage haben.

3. **type-coverage-ignores abbauen**
   - Für jede Zeile mit `type-coverage:ignore`:
     - Grund verstehen (z.B. `any`, `unknown`, aggressive Casts).
     - Bessere Typisierung einführen:
       - Typ-Aliase, generische Hilfstypen oder engere Interfaces.
     - Ignore entfernen, `npm run type-coverage` laufen lassen.

4. **Linter-/TS-Ignores abbauen**
   - `eslint-disable`, `ts-ignore` nur akzeptieren, wenn:
     - sie bekannte Bugs/Limitierungen in externen Typdefinitionen abfangen,
     - und mit Kommentar + ggf. Issue-/ADR-Verweis dokumentiert sind.
   - Sonst:
     - Code so anpassen, dass der Linter ohne Ignore sauber durchläuft.

5. **Qualitäts-Gate festschreiben**
   - In `docs/TESTING.md` oder einem geeigneten Dokument festhalten:
     - In `core`, `services`, `utils`, `types` sind Ignores grundsätzlich verboten.
     - Neue Ignores in diesen Bereichen gelten als Architekturbefund und müssen entfernt werden.


