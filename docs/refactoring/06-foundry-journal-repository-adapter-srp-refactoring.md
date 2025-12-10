# Refactoring-Plan: FoundryJournalRepositoryAdapter SRP-Verletzung

**Erstellungsdatum:** 2025-12-10
**Status:** Geplant
**Priorität:** Niedrig
**Betroffene Datei:** `src/infrastructure/adapters/foundry/repository-adapters/foundry-journal-repository-adapter.ts`

---

## Problem-Beschreibung

Die `FoundryJournalRepositoryAdapter`-Klasse verletzt das Single Responsibility Principle (SRP) teilweise, indem sie Collection UND Repository kombiniert:

1. **Collection-Operationen** (delegiert zu FoundryJournalCollectionAdapter)
2. **Repository-Operationen** (create, update, delete, flags)
3. **Type-Mapping** (Foundry → Domain)

**Aktuelle Architektur:**
- FoundryJournalRepositoryAdapter delegiert Collection-Operationen zu FoundryJournalCollectionAdapter
- Führt Repository-Operationen selbst aus
- Führt Type-Mapping durch

**Problem:** Kombiniert Collection UND Repository. Sollte nur Repository sein, Collection ist separate Verantwortlichkeit. Aktuell nutzt Delegation statt Composition.

---

## Ziel-Architektur

### Neue Klassen-Struktur

```
FoundryJournalRepositoryAdapter (nur Repository)
├── create()
├── update()
├── delete()
├── flags()
└── Type-Mapping (Foundry → Domain)

FoundryJournalCollectionAdapter (bereits vorhanden)
└── Collection-Operationen

FoundryJournalRepositoryAdapter (refactored)
└── Nutzt Composition statt Delegation
    └── collectionAdapter: FoundryJournalCollectionAdapter (als Dependency)
```

### Verantwortlichkeiten

| Klasse | Verantwortlichkeit | Methoden |
|--------|-------------------|----------|
| `FoundryJournalRepositoryAdapter` | Nur Repository-Operationen | `create()`, `update()`, `delete()`, `flags()` |
| `FoundryJournalCollectionAdapter` | Nur Collection-Operationen | (bereits vorhanden) |
| Type-Mapping | Separate Utility-Klasse | `mapFoundryToDomain()`, `mapDomainToFoundry()` |

---

## Schritt-für-Schritt Refactoring-Plan

### Phase 1: Vorbereitung (Tests & Interfaces)

1. **Tests für aktuelle Funktionalität schreiben**
   - Alle Public-Methoden von FoundryJournalRepositoryAdapter testen
   - Collection-Delegation testen
   - Repository-Operationen testen
   - Type-Mapping testen

2. **Interfaces definieren**
   ```typescript
   interface IJournalTypeMapper {
     mapFoundryToDomain(foundry: FoundryJournal): DomainJournal;
     mapDomainToFoundry(domain: DomainJournal): FoundryJournal;
   }
   ```

### Phase 2: Type-Mapping extrahieren

3. **JournalTypeMapper erstellen**
   - Datei: `src/infrastructure/adapters/foundry/mappers/journal-type-mapper.ts`
   - Implementiert `IJournalTypeMapper`
   - Enthält alle Type-Mapping-Logik aus Repository-Adapter
   - Tests schreiben

### Phase 3: FoundryJournalRepositoryAdapter refactoren

4. **Delegation zu Composition ändern**
   - FoundryJournalCollectionAdapter als Dependency injizieren (statt intern zu instanziieren)
   - Collection-Operationen nutzen Composition statt Delegation
   - Repository-Operationen bleiben unverändert

5. **Type-Mapping extrahieren**
   - Type-Mapping-Logik entfernen aus Repository-Adapter
   - JournalTypeMapper als Dependency injizieren
   - Repository-Adapter nutzt Mapper für Type-Conversions

6. **Constructor anpassen**
   - FoundryJournalCollectionAdapter als Parameter
   - JournalTypeMapper als Parameter
   - Factory-Methoden anpassen

### Phase 4: Integration & Tests

7. **Integration Tests**
   - FoundryJournalRepositoryAdapter mit Collection-Adapter zusammen testen
   - FoundryJournalRepositoryAdapter mit Type-Mapper zusammen testen
   - Vollständiger Flow: Create → Map → Collection → Repository

8. **Performance Tests**
   - Sicherstellen, dass keine Performance-Regression auftritt

---

## Migration-Strategie

### Backward Compatibility

- **Public API bleibt unverändert**: Alle Public-Methoden bleiben erhalten
- **Interne Implementierung ändert sich**: Delegation → Composition, Type-Mapping extrahiert
- **Keine Breaking Changes**: Externe Consumer merken keine Änderung

### Rollout-Plan

1. **Feature Branch erstellen**: `refactor/journal-repository-adapter-srp`
2. **JournalTypeMapper implementieren**: Parallel zu bestehendem Code
3. **FoundryJournalRepositoryAdapter refactoren**: Composition + Type-Mapper
4. **Tests durchlaufen lassen**: Alle Tests müssen grün sein
5. **Code Review**: Review der Refactoring-Änderungen
6. **Merge**: In Main-Branch mergen

---

## Tests

### Unit Tests

- **JournalTypeMapper**
  - `mapFoundryToDomain()` mappt korrekt
  - `mapDomainToFoundry()` mappt korrekt
  - Edge Cases (null, undefined, invalid data)

- **FoundryJournalRepositoryAdapter (refactored)**
  - `create()` nutzt Composition korrekt
  - `update()` nutzt Composition korrekt
  - `delete()` nutzt Composition korrekt
  - `flags()` nutzt Composition korrekt
  - Type-Mapping nutzt Mapper korrekt

### Integration Tests

- **FoundryJournalRepositoryAdapter + Collection-Adapter**
  - Collection-Operationen funktionieren über Composition
  - Repository-Operationen funktionieren korrekt

- **FoundryJournalRepositoryAdapter + Type-Mapper**
  - Type-Mapping funktioniert korrekt
  - Domain ↔ Foundry Conversions funktionieren

- **Vollständiger Flow**
  - Create → Map → Collection → Repository

### Regression Tests

- Alle bestehenden Tests müssen weiterhin funktionieren
- Keine Performance-Regression

---

## Breaking Changes

**Keine Breaking Changes erwartet**

- Public API bleibt unverändert
- Interne Implementierung ändert sich nur
- Externe Consumer merken keine Änderung

---

## Risiken

### Technische Risiken

1. **Performance-Regression**
   - **Risiko**: Zusätzliche Composition-Layer könnten Performance beeinträchtigen
   - **Mitigation**: Performance Tests durchführen, ggf. optimieren

2. **Type-Mapping-Fehler**
   - **Risiko**: Type-Mapper mappt nicht korrekt
   - **Mitigation**: Umfassende Tests für alle Mapping-Szenarien

3. **Composition-Fehler**
   - **Risiko**: Composition funktioniert nicht korrekt
   - **Mitigation**: Integration Tests

### Projekt-Risiken

1. **Zeitaufwand**
   - **Risiko**: Refactoring dauert länger als erwartet
   - **Mitigation**: Schrittweise Vorgehen, Feature Branch

2. **Code-Review-Komplexität**
   - **Risiko**: Große PR mit vielen Änderungen
   - **Mitigation**: Kleine, inkrementelle Commits

---

## Erfolgs-Kriterien

- ✅ FoundryJournalRepositoryAdapter nutzt Composition statt Delegation
- ✅ JournalTypeMapper verwaltet Type-Mapping
- ✅ FoundryJournalRepositoryAdapter ist nur für Repository-Operationen zuständig
- ✅ Alle Tests bestehen (Unit + Integration)
- ✅ Keine Performance-Regression
- ✅ Keine Breaking Changes
- ✅ Code Review bestanden
- ✅ Dokumentation aktualisiert

---

## Offene Fragen

1. Soll JournalTypeMapper als Singleton oder pro Repository-Instanz sein?
2. Wie wird Type-Mapping-Caching gehandhabt?
3. Soll JournalTypeMapper auch für andere Adapter verwendet werden?

---

## Referenzen

- [SOLID-Analyse: SRP](../Analyse/solid-01-single-responsibility-principle.md)
- [FoundryJournalRepositoryAdapter Source Code](../../src/infrastructure/adapters/foundry/repository-adapters/foundry-journal-repository-adapter.ts)
- [FoundryJournalCollectionAdapter](../../src/infrastructure/adapters/foundry/collection-adapters/foundry-journal-collection-adapter.ts)

---

**Letzte Aktualisierung:** 2025-12-10

