# Teilplan 03 – Foundry-Adapter & Ports (`src/foundry/**`)

## Scope

- `src/foundry/errors/**`
- `src/foundry/facades/**`
- `src/foundry/interfaces/**`
- `src/foundry/ports/**`
- `src/foundry/services/**`
- `src/foundry/validation/**`
- `src/foundry/versioning/**`

Ziel: Foundry-spezifische Adapter, Ports und Services haben getestete Erfolgs- und Fehlerpfade. Ignores werden minimiert; verbleibende Ausnahmen sind klar env-spezifisch.

## Schritte

1. **Inventur in `src/foundry/**`**
   - Alle `c8 ignore`, `type-coverage:ignore`, `eslint-disable`, `ts-ignore` in diesem Baum identifizieren.
   - Pro Stelle notieren:
     - Art (Coverage/Type/Lint).
     - Kontext (Port, Service, Validation, Versioning).

2. **Ports (`ports/v13/*.ts`)**
   - Prüfen, ob alle relevanten Pfade getestet sind:
     - Erfolgreiche Aufrufe gegen Foundry-Port-Mocks.
     - Fehlerpfade (z.B. falsche Parameter, Port nicht verfügbar).
   - Tests in `ports/v13/__tests__` ggf. erweitern:
     - So dass jeder `err(...)`-Pfad einmal durchlaufen wird.
   - `c8 ignore` in Ports nach Möglichkeit entfernen.

3. **Services (`services/Foundry*Service.ts`)**
   - Fokus auf:
     - `withRetry`-Pfad (Erfolg, OperationFailed, PortSelectionFailed).
     - Dispose-/Cleanup-Logik (z.B. Hooks deregistrieren).
   - Tests in `foundry/services/__tests__` erweitern:
     - Alle Branches und Fehlerpfade abdecken.
   - Ignores nur, wenn wirklich nur eine direkte Weiterleitung zu Foundry-API ohne eigene Logik vorliegt und E2E-Tests den Pfad abdecken.

4. **Validation & Versioning (`validation/**`, `versioning/**`)**
   - `schemas.ts`, `setting-schemas.ts`, `input-validators.ts`:
     - Sicherstellen, dass alle Validierungsfehlerpfade über Unit-Tests (`schemas.test.ts`, `input-validators-security.test.ts`) abgedeckt sind.
   - Versioning (`PortSelector`, `PortRegistry`, Events/Observer):
     - Erfolgs- und Fehlerpfade, inkl. „kein kompatibler Port“ und „Port-Factory wirft“.
   - Existierende Ignores entfernen oder auf echte Library-Spezialfälle begrenzen.

5. **Error-Objekte & FoundryErrors**
   - In `FoundryErrors.ts` und allen Stellen, die `createFoundryError` nutzen:
     - Tests schreiben, die sicherstellen, dass Codes, Messages und Metadata korrekt gesetzt werden.
   - Keine `ts-ignore`/`type-coverage:ignore` für FoundryError-Typen, sofern nicht durch fvtt-types erzwungen.

6. **Abschluss für Foundry-Adapter**
   - `npm run test:coverage` auf den Foundry-Bereich fokussiert laufen lassen (optional per Filter).
   - Ziel:
     - Hohe Coverage (nahe 100 %) für `src/foundry/**`.
     - Verbleibende Ignores sind:
       - selten,
       - klar kommentiert (z.B. „requires real Foundry UI / browser environment, covered in E2E“).


