---
ID: DIP-002
Prinzip: DIP
Schweregrad: Hoch
Module/Layer: domain/windows
Status: Proposed
Reviewed: 2026-01-19
Relevance: still-relevant
Notes: `src/domain/windows/ports/foundry-window-adapter.interface.ts` still exists and exposes Foundry-specific `ApplicationClass`.
---

# 1. Problem

Die Domain definiert einen Foundry-spezifischen Port (`IFoundryWindowAdapter`) und Foundry-spezifische Typen (`ApplicationClass`). Das verankert Plattformdetails im Domain-Kern und verletzt die Clean-Architecture-Regel „Domain kennt keine Frameworks“.

# 2. Evidence (Belege)

**Pfade & Knoten**
- `src/domain/windows/ports/foundry-window-adapter.interface.ts`
- `src/domain/windows/types/application-v2.interface.ts`

**Minimierte Codeauszüge**
```ts
// src/domain/windows/ports/foundry-window-adapter.interface.ts
export interface IFoundryWindowAdapter {
  buildApplicationWrapper(...): Result<ApplicationClass, WindowError>;
}
```
```ts
// src/domain/windows/types/application-v2.interface.ts
export type ApplicationClass = new (...args: unknown[]) => ApplicationV2;
```

# 3. SOLID-Analyse

**DIP-Verstoß:** Domain-Abstraktionen referenzieren Foundry-spezifische Konzepte (ApplicationV2). Die Domain hängt damit von Infrastruktur/Framework ab, statt umgekehrt.

**Nebenwirkungen:**
- Plattformwechsel (z. B. andere VTT) erfordert Domain-Änderungen.
- Testbarkeit sinkt (Domain braucht Foundry-Typen).

# 4. Zielbild

- Foundry-spezifische Adapter gehören in **Infrastructure** oder **Framework**.
- Domain definiert generische Window-Ports (z. B. `WindowAdapterPort`).
- Foundry-Adapter implementieren die generische Domain-Schnittstelle.

# 5. Lösungsvorschlag

**Approach A (empfohlen)**
- Verschiebe `IFoundryWindowAdapter` nach `infrastructure/windows/adapters/foundry/`.
- Ersetze Domain-Referenz durch einen generischen `WindowAdapterPort`.
- `ApplicationClass` als Infrastruktur-Typ kapseln.

**Approach B (Alternative)**
- Behalte den Port im Domain, aber entkoppel die Signatur von Foundry-Typen (z. B. `WindowAdapterHandle`).

**Trade-offs:**
- A: saubere Trennung, stärkerer Umbau.
- B: weniger Änderung, aber Domain bleibt unrein.

# 6. Refactoring-Schritte

1. Domain-Port `WindowAdapterPort` definieren (framework-neutral).
2. `IFoundryWindowAdapter` in Infrastruktur verschieben und implementiert `WindowAdapterPort`.
3. `ApplicationClass` aus Domain entfernen oder in Infrastructure kapseln.
4. Imports/DI-Registrierungen anpassen.

**Breaking Changes:**
- Signaturen von Window-Adapter-Abhängigkeiten ändern.

# 7. Beispiel-Code

**Before**
```ts
interface IFoundryWindowAdapter {
  buildApplicationWrapper(...): Result<ApplicationClass, WindowError>;
}
```

**After**
```ts
interface WindowAdapterPort {
  buildWindowAdapter(...): Result<WindowAdapterHandle, WindowError>;
}
```

# 8. Tests & Quality Gates

- Architecture-Lint: Domain darf keine `Foundry*`-Typen importieren.
- Infrastruktur-Adapter-Tests für Foundry-Integration.

# 9. Akzeptanzkriterien

- Domain enthält keine Foundry-spezifischen Ports/Typen.
- Foundry-Adapter leben ausschließlich in Infrastructure/Framework.
