# OCP-Plan: PortSelector – austauschbare Matching-Strategie

**Erstellungsdatum:** 2025-12-10
**Status:** Geplant
**Priorität:** Mittel
**Betroffene Datei:** `src/infrastructure/adapters/foundry/versioning/portselector.ts`

---

## Problem-Beschreibung
- Version-Matching ist hart im Code verankert ("greedy highest <= version").
- Keine Möglichkeit, alternative Strategien (z. B. strict, LTS, beta-first) zu hinterlegen.
- Erweiterungen erfordern Codeänderungen am PortSelector selbst → OCP-Verstoß.

---

## Ziel-Architektur
- `PortSelector` konsumiert eine injizierte `PortMatchStrategy`.
- Strategien können ausgetauscht oder kombiniert werden, ohne den Selector zu ändern.
- Event-/Observability-Logik bleibt unverändert und arbeitet auf Strategy-Ergebnissen.

### Verantwortlichkeiten
| Komponente | Aufgabe |
| --- | --- |
| `PortSelector` | Delegiert das Matching an die injizierte Strategie und emittiert Events. |
| `PortMatchStrategy` (neu, Interface) | Definiert `select(tokens, version): PortMatchResult`. |
| `PortMatchStrategyRegistry` (optional) | Ermöglicht Auswahl der Strategie zur Laufzeit (z. B. konfigurierbar). |

---

## Schritt-für-Schritt Refactoring-Plan
1. **Strategy-Interface definieren**
   - Signatur: `select(ports: PortRegistration[], version: FoundryVersion): Result<PortMatch, MatchError>`.
   - `PortMatch` enthält Token und Version; Fehler beschreibt Missing/Conflict.

2. **Default-Strategie extrahieren**
   - Bisherige greedy-Logik in `GreedyPortMatchStrategy` auslagern.
   - Tests für Grenzfälle (keine Ports, mehrere Matches, exact match bevorzugen?).

3. **Selector umbauen**
   - Konstruktor akzeptiert `PortMatchStrategy` oder Registry.
   - Selector ruft nur noch `strategy.select(...)` auf und verarbeitet Events/Errors generisch.

4. **Konfigurierbarkeit ergänzen**
   - Optionale Registry + Config, um Strategie per Setting auszuwählen.
   - Validierung: unbekannte Strategien führen zu klaren Fehlern/Defaults.

5. **Tests erweitern**
   - Strategy-Swapping verifizieren (z. B. strict vs. greedy).
   - Event-Emission unverändert sicherstellen.

---

## Erfolgskriterien
- Neue Matching-Varianten werden ausschließlich als Strategien hinzugefügt.
- `PortSelector` enthält keine Matching-Logik mehr selbst.
- Tests decken Standard- und alternative Strategien ab.
- SRP-Aufteilung aus `04-port-selector-srp-refactoring.md` bleibt gültig.
