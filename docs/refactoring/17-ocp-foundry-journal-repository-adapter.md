# OCP-Plan: FoundryJournalRepositoryAdapter – Mapper-Registry

**Erstellungsdatum:** 2025-12-10
**Status:** Geplant
**Priorität:** Niedrig
**Betroffene Datei:** `src/infrastructure/adapters/foundry/repository-adapters/foundry-journal-repository-adapter.ts`

---

## Problem-Beschreibung
- Mapping von Foundry-Entities zu Domain ist fest verdrahtet (id, name).
- Neue Felder/Varianten (z. B. Folder-Attribute, Flags) erfordern Codeänderungen am Adapter.
- Kein Erweiterungspunkt für alternative Mapper → OCP-Verstoß.

---

## Ziel-Architektur
- Einführung eines `JournalMapper`-Interfaces mit `supports(foundryEntity)` und `toDomain(foundryEntity)`.
- Adapter injiziert eine Mapper-Registry und delegiert Mapping an die erste passende Strategie.
- Neue Felder/Varianten werden durch zusätzliche Mapper ergänzt, ohne den Adapter zu ändern.

### Verantwortlichkeiten
| Komponente | Aufgabe |
| --- | --- |
| `FoundryJournalRepositoryAdapter` | Orchestriert Repository-Aufrufe und delegiert Mapping. |
| `JournalMapper` (neu, Interface) | Entscheidet Unterstützbarkeit und wandelt Foundry-Objekte in Domain-Objekte. |
| `JournalMapperRegistry` (neu) | Hält eine priorisierte Liste registrierter Mapper. |

---

## Schritt-für-Schritt Refactoring-Plan
1. **Mapper-Interface definieren**
   - Signaturen: `supports(entity: unknown): boolean` (Type Guards) und `toDomain(entity): JournalEntity`.

2. **Registry einführen**
   - `JournalMapperRegistry.getAll(): JournalMapper[]` mit Priorisierung.
   - Validierung auf doppelte `supports`-Treffer (Fehler oder Priorität löst Konflikt).

3. **Adapter umbauen**
   - Konstruktor akzeptiert Registry und optional eine Default-Strategie.
   - `mapFoundryJournal` delegiert ausschließlich an Registry, keine Feldlisten mehr im Adapter.

4. **Tests ergänzen**
   - Neue Mapper per Test hinzufügen und sicherstellen, dass Adapter unverändert funktioniert.
   - Fehlerszenarien: kein passender Mapper, mehrere passende Mapper → klare Fehlermeldung oder Prioritätsregel.

5. **Migration**
   - Bestehendes Mapping als `DefaultJournalMapper` implementieren.
   - Schrittweise zusätzliche Mapper hinzufügen (z. B. Folder, Flags, Custom Fields).

---

## Erfolgskriterien
- Adapter enthält keine hartkodierten Field-Mappings mehr.
- Neue Journal-Varianten werden durch zusätzliche Mapper ergänzt.
- Tests sichern Positiv-/Negativfälle und Prioritätslogik ab.
- SRP-Aufteilung aus `06-foundry-journal-repository-adapter-srp-refactoring.md` bleibt unverändert.
