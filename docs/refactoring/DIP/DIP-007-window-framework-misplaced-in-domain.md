---
ID: DIP-007
Prinzip: DIP
Schweregrad: Hoch
Module/Layer: domain/windows
Status: Proposed
Reviewed: 2026-01-19
---

# 1. Problem

Der Domain-Layer enthält mit `src/domain/windows/**` ein **technisches Window-/UI-Framework** (Actions, Controls, Render Engines, Controller Contracts, ViewModels). Das ist keine fachliche Domäne, sondern ein Infrastruktur-/Framework-Subsystem.

Dadurch wird die innere Schicht zum „UI-Kern“ und zieht zwangsläufig Platform-Leaks nach innen (DOM-Typen, Renderer-IDs, Foundry Application Wrapper usw.). Die vorhandenen Findings DIP-001/002/004 und OCP-002 sind Symptome dieses Layer-Missplacements.

# 2. Evidence (Belege)

**Pfade & Knoten (Auswahl)**
- `src/domain/windows/ports/window-controller-port.interface.ts` (Lifecycle + Actions + Persist + ViewModel)
- `src/domain/windows/ports/render-engine-port.interface.ts` (mount/unmount/update auf DOM Targets)
- `src/domain/windows/types/action-definition.interface.ts` (ActionContext trägt `event?: Event`)
- `src/domain/windows/types/component-descriptor.interface.ts` (`RenderEngineType` als union)
- `src/domain/windows/types/component-instance.interface.ts` (UI-Framework-Instance Types + `HTMLElement`)

# 3. SOLID-Analyse

**DIP-Verstoß (systemisch):** Domain wird nicht mehr „Policy“, sondern hält technische Mechanismen. Dadurch entstehen Abhängigkeiten in die falsche Richtung und der Domain-Layer kann nicht ohne UI/Foundry/DOM existieren.

**Nebenwirkungen**
- SRP-Breaks: ein „Domain“-Subsystem koordiniert UI-Lifecycle und Persistenz.
- OCP-Breaks: Erweiterung um neue Render Engines erfordert Domain-Änderungen (siehe OCP-002).
- ISP-Breaks: Ports werden breit, weil sie unterschiedliche technische Aspekte bündeln (siehe ISP-002).

# 4. Zielbild

Optionen für saubere Modulgrenzen:

- **Variante A (empfohlen): Application enthält ein `ui-kernel` Subsystem**
  - `src/application/ui-kernel/**`: Window definitions, action wiring, view models, controller/service orchestration
  - Domain bleibt rein fachlich (`relationship-*`, journal visibility, etc.)

- **Variante B: Framework/Infrastructure enthält das Window-System**
  - Domain exportiert nur fachliche Use-Cases/Policies
  - UI-Framework ist komplett outer layer

Dependency-Regel: `src/domain/**` darf **keine** UI-/Window-Framework-APIs definieren.

# 5. Lösungsvorschlag

**Approach A (empfohlen): Windows aus Domain herauslösen**
- Verschiebe `src/domain/windows/**` nach `src/application/windows-kernel/**` (oder `src/framework/windows/**`).
- Definiere in Domain nur noch die *fachlichen* Ports/Use-Cases, die UI konsumiert.
- UI-spezifische Typen bleiben außerhalb Domain.

**Approach B (Alternative): Domain behält „Window-DSL“, aber ohne Platform Types**
- Domain darf eine abstrakte UI-DSL definieren (Actions/Controls), aber:
  - keine DOM-Typen (`Event`, `HTMLElement`)
  - keine Renderer-/Framework-Types
  - keine Foundry Application Konzepte

Trade-offs:
- A ist „cleaner“ und reduziert künftige SOLID-Drift.
- B ist weniger invasiv, aber schwer dauerhaft sauber zu halten.

# 6. Refactoring-Schritte

1. Zielort festlegen (`src/application/ui-kernel` o. ä.) und Arch-Regel hinzufügen.
2. Schrittweise Migration:
   - Ports/Types zuerst (compile-only move)
   - danach Implementierungen/Factories
3. Entfernen der Platform-Leaks aus dem umgezogenen Subsystem (DIP-001/002/004, OCP-002).
4. Update aller Import-Pfade (`@/domain/windows/...` → neuer Pfad).

**Breaking Changes**
- Viele Import-Pfade ändern sich; API-Exposure (Module API) ggf. neu schneiden.

# 7. Beispiel-Code

**After (Ordnerstruktur-Vorschlag)**

```text
src/
  domain/
    entities/
    ports/              # nur fachliche ports
    types/
  application/
    ui-kernel/
      windows/
      actions/
      view-model/
      rendering-ports/  # wenn nötig
```

# 8. Tests & Quality Gates

- Arch-Gate: `src/domain/**` enthält keine `windows/` Subsystem-APIs mehr.
- Typecheck: Domain kann ohne DOM-lib gebaut werden (separater tsconfig für Domain optional).
- Regression: Window-System Integrationstests bleiben grün (nach Pfad-Update).

# 9. Akzeptanzkriterien

- `src/domain/windows/**` existiert nicht mehr (oder ist strikt fachlich und platformfrei, je nach gewählter Variante).
- Keine DOM-/Foundry-/UI-Framework Typen im Domain-Layer.
