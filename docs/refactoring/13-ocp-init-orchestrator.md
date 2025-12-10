# OCP-Plan: InitOrchestrator – Bootstrapper-Registry

**Erstellungsdatum:** 2025-12-10
**Status:** Geplant
**Priorität:** Mittel
**Betroffene Datei:** `src/framework/core/bootstrap/init-orchestrator.ts`

---

## Problem-Beschreibung
- Die Ausführungsreihenfolge der Bootstrapper ist fest im Code hinterlegt.
- Neue Phasen oder optionale Schritte erfordern Änderungen direkt im Orchestrator.
- Fehler- und Observability-Handling sind an die fixe Liste gekoppelt → OCP-Verstoß.

---

## Ziel-Architektur
- `InitOrchestrator` konsumiert eine injizierte, geordnete Registry von `InitPhase`-Objekten.
- Kritikalität/Fehlerstrategie werden auf Phase-Ebene modelliert, nicht im Orchestrator selbst.
- Observability-Hooks (Events/Tracing) hängen sich an die Registry-Verarbeitung, ohne Kernlogik anzupassen.

### Verantwortlichkeiten
| Komponente | Aufgabe |
| --- | --- |
| `InitOrchestrator` | Iteriert über die bereitgestellten `InitPhase`-Instanzen und steuert die Reihenfolge. |
| `InitPhase` (Interface) | Name, Priorität, `execute()` und optionaler Fehler-Handling-Modus. |
| `InitPhaseRegistry` (neu) | Liefert sortierte Phasen gemäß Priorität oder expliziter Reihenfolge. |

---

## Schritt-für-Schritt Refactoring-Plan
1. **Phase-Interface definieren**
   - Felder: `id`, `priority`, `criticality`, `execute(ctx): Promise<void>`.
   - Fehlerstrategie über Enum modellieren (z. B. `haltOnError`, `warnAndContinue`).

2. **Registry einführen**
   - `InitPhaseRegistry.getAll(): InitPhase[]` liefert bereits sortierte Phasen.
   - Optional: Sorting im Orchestrator kapseln, wenn Registry unsortiert liefert.

3. **Orchestrator umbauen**
   - Konstruktor erwartet `InitPhaseRegistry` statt fixer Parameterliste.
   - Schleife verarbeitet `InitPhase[]`; Fehlerverhalten richtet sich nach `criticality`.

4. **Observability entkoppeln**
   - Events/Tracing als Decorator oder Hook um die Phasen-Ausführung legen.
   - Keine Phasen-spezifischen Sonderfälle mehr im Orchestrator.

5. **Tests ergänzen**
   - Reihenfolge-Tests über Prioritäten.
   - Fehlerbehandlung pro `criticality` validieren.
   - Erweiterbarkeit: neue Phase über Registry-Mock zufügen, ohne Codeänderung am Orchestrator.

---

## Erfolgskriterien
- Neue Bootstrap-Phasen lassen sich durch Registry-Erweiterung hinzufügen.
- Der Orchestrator enthält keine feste Liste oder If-Kaskade mehr.
- Fehler- und Observability-Logik sind phasenmodelliert und nicht hart verdrahtet.
- Tests belegen korrekte Ausführung, Fehlermodi und Erweiterbarkeit.
