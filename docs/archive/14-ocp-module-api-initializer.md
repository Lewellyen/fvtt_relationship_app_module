# OCP-Plan: ModuleApiInitializer – Wrapper-Strategien

**Erstellungsdatum:** 2025-12-10
**Status:** Geplant
**Priorität:** Mittel
**Betroffene Datei:** `src/framework/core/api/module-api-initializer.ts`

---

## Problem-Beschreibung
- `wrapSensitiveService` prüft eine feste Token-Liste (`i18n`, `notification`, `settings`).
- Neue API-Services oder abweichende Schutzstrategien erfordern Codeänderungen.
- Harte If/Else-Ketten verhindern Erweiterbarkeit und verletzen das OCP.

---

## Ziel-Architektur
- Einführung eines `ApiWrapperStrategy`-Interfaces mit `supports(token)` und `wrap(service)`.
- Strategien werden über DI registriert und in definierter Reihenfolge ausgewertet.
- `ModuleApiInitializer` delegiert nur an Strategien, bleibt selbst unverändert bei neuen Services.

### Verantwortlichkeiten
| Komponente | Aufgabe |
| --- | --- |
| `ModuleApiInitializer` | Baut die API auf und delegiert das Wrapping an Strategien. |
| `ApiWrapperStrategy` (neu, Interface) | Entscheidet, ob ein Token unterstützt wird, und liefert die Wrapper-Instanz. |
| `ApiWrapperStrategyRegistry` (neu) | Verwaltet registrierte Strategien und ihre Prioritäten. |

---

## Schritt-für-Schritt Refactoring-Plan
1. **Strategy-Interface definieren**
   - Signaturen: `supports(token: string): boolean` und `wrap(service: unknown): unknown` (bzw. generisch mit Type Guards).

2. **Registry einführen**
   - `ApiWrapperStrategyRegistry.getAll(): ApiWrapperStrategy[]` mit Priorisierung.
   - Optional: Fallback-Strategie für "keine Änderung".

3. **Initializer umbauen**
   - `wrapSensitiveService` iteriert über Strategien und wendet die erste passende an.
   - Keine Token-spezifischen If/Else-Blöcke mehr.

4. **Tests ergänzen**
   - Sicherstellen, dass neue Tokens über Strategy-Mocks hinzugefügt werden können.
   - Reihenfolge/Priorität testen (z. B. spezifischer vor generischem Wrapper).

5. **Migration**
   - Bestehende Token-Checks in konkrete Strategien überführen (I18n, Notifications, Settings).
   - Alte Logik entfernen, sobald Strategien greifen.

---

## Erfolgskriterien
- Neue API-Services/Tokens erfordern nur neue Strategien, keine Änderungen am Initializer.
- Wrapper-Auswahl erfolgt ausschließlich über die Registry.
- Tests decken positive/negative Pfade und Prioritäten ab.
- SRP-Aufteilung aus `05-module-api-initializer-srp-refactoring.md` bleibt erhalten.
