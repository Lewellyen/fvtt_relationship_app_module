# Refactoring-Plan: RetryService SRP-Verletzung

**Erstellungsdatum:** 2025-12-10
**Status:** Geplant
**Priorität:** Niedrig
**Betroffene Datei:** `src/infrastructure/retry/RetryService.ts`

---

## Problem-Beschreibung

Die `RetryService`-Klasse verletzt das Single Responsibility Principle (SRP) mit 2 verschiedenen Verantwortlichkeiten:

1. **Retry-Algorithmus** (bereits in BaseRetryService)
2. **Observability** (bereits in RetryObservabilityDecorator)

**Aktuelle Architektur:**
- RetryService erweitert RetryObservabilityDecorator
- RetryObservabilityDecorator erweitert BaseRetryService
- RetryService ist eine Wrapper-Klasse, die beide kombiniert

**Problem:** Obwohl bereits aufgeteilt, ist RetryService noch eine Wrapper-Klasse, die beide kombiniert. Die Komposition sollte in eine separate Factory-Klasse ausgelagert werden, oder RetryService sollte direkt BaseRetryService + RetryObservabilityDecorator komponieren statt Vererbung zu nutzen.

---

## Ziel-Architektur

### Neue Klassen-Struktur

```
RetryService (nur Retry-Interface)
└── Delegiert zu komponiertem Retry-Service

RetryServiceCompositionFactory (nur Komposition)
├── createRetryService(logger)
└── Komponiert BaseRetryService + RetryObservabilityDecorator

BaseRetryService (bereits vorhanden)
└── Retry-Algorithmus

RetryObservabilityDecorator (bereits vorhanden)
└── Observability (Logging, Timing)
```

### Verantwortlichkeiten

| Klasse | Verantwortlichkeit | Methoden |
|--------|-------------------|----------|
| `RetryService` | Nur Retry-Interface | Delegiert zu komponiertem Retry-Service |
| `RetryServiceCompositionFactory` | Nur Retry-Service-Komposition | `createRetryService()` |
| `BaseRetryService` | Nur Retry-Algorithmus | (bereits vorhanden) |
| `RetryObservabilityDecorator` | Nur Observability | (bereits vorhanden) |

---

## Schritt-für-Schritt Refactoring-Plan

### Phase 1: Vorbereitung (Tests & Interfaces)

1. **Tests für aktuelle Funktionalität schreiben**
   - Alle Public-Methoden von RetryService testen
   - Retry-Algorithmus testen
   - Observability testen

2. **Interfaces definieren**
   ```typescript
   interface IRetryServiceCompositionFactory {
     createRetryService(logger: Logger): RetryService;
   }
   ```

### Phase 2: RetryServiceCompositionFactory erstellen

3. **RetryServiceCompositionFactory erstellen**
   - Datei: `src/infrastructure/retry/factory/retry-service-composition-factory.ts`
   - Implementiert `IRetryServiceCompositionFactory`
   - Komponiert BaseRetryService + RetryObservabilityDecorator
   - Tests schreiben

### Phase 3: RetryService refactoren

4. **RetryService umbauen**
   - Vererbung entfernen (extends RetryObservabilityDecorator)
   - RetryService komponiert BaseRetryService + RetryObservabilityDecorator
   - RetryService delegiert alle Methoden an komponierten Service
   - Dependencies injizieren: `BaseRetryService`, `RetryObservabilityDecorator`

5. **Alternative: Factory-Methode**
   - Statt Dependency-Injection: Factory-Methode `create()` nutzen
   - RetryService.create(logger) → erstellt Service via Factory

6. **Constructor anpassen**
   - BaseRetryService als Parameter
   - RetryObservabilityDecorator als Parameter
   - RetryService speichert komponierten Service

### Phase 4: Integration & Tests

7. **Integration Tests**
   - RetryService + RetryServiceCompositionFactory zusammen testen
   - Vollständiger Flow: Create → Compose → Retry → Observability
   - Retry-Algorithmus funktioniert korrekt
   - Observability funktioniert korrekt

8. **Performance Tests**
   - Sicherstellen, dass keine Performance-Regression auftritt

---

## Migration-Strategie

### Backward Compatibility

- **Public API bleibt unverändert**: Alle Public-Methoden bleiben erhalten
- **Interne Implementierung ändert sich**: Vererbung → Komposition
- **Keine Breaking Changes**: Externe Consumer merken keine Änderung

### Rollout-Plan

1. **Feature Branch erstellen**: `refactor/retry-service-srp`
2. **RetryServiceCompositionFactory implementieren**: Parallel zu bestehendem Code
3. **RetryService refactoren**: Vererbung → Komposition
4. **Tests durchlaufen lassen**: Alle Tests müssen grün sein
5. **Code Review**: Review der Refactoring-Änderungen
6. **Merge**: In Main-Branch mergen

---

## Tests

### Unit Tests

- **RetryServiceCompositionFactory**
  - `createRetryService()` komponiert Service korrekt
  - BaseRetryService + RetryObservabilityDecorator werden korrekt kombiniert
  - Edge Cases (null logger)

- **RetryService (refactored)**
  - Alle Retry-Methoden delegieren korrekt
  - Service wird korrekt komponiert
  - Retry-Algorithmus funktioniert
  - Observability funktioniert

### Integration Tests

- **RetryService + RetryServiceCompositionFactory**
  - Service-Komposition funktioniert
  - Retry-Algorithmus funktioniert
  - Observability funktioniert

- **Vollständiger Flow**
  - Create → Compose → Retry → Observability

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
   - **Risiko**: Zusätzliche Kompositions-Layer könnten Performance beeinträchtigen
   - **Mitigation**: Performance Tests durchführen, ggf. optimieren

2. **Kompositions-Fehler**
   - **Risiko**: Service wird nicht korrekt komponiert
   - **Mitigation**: Umfassende Tests für alle Kompositions-Szenarien

3. **Vererbungs-zu-Komposition-Migration**
   - **Risiko**: Vererbung → Komposition könnte Fehler einführen
   - **Mitigation**: Umfassende Tests, schrittweise Migration

### Projekt-Risiken

1. **Zeitaufwand**
   - **Risiko**: Refactoring dauert länger als erwartet
   - **Mitigation**: Schrittweise Vorgehen, Feature Branch

2. **Code-Review-Komplexität**
   - **Risiko**: Große PR mit vielen Änderungen
   - **Mitigation**: Kleine, inkrementelle Commits

---

## Erfolgs-Kriterien

- ✅ RetryService ist nur für Retry-Interface zuständig
- ✅ RetryServiceCompositionFactory verwaltet Service-Komposition
- ✅ Retry-Algorithmus funktioniert korrekt
- ✅ Observability funktioniert korrekt
- ✅ Alle Tests bestehen (Unit + Integration)
- ✅ Keine Performance-Regression
- ✅ Keine Breaking Changes
- ✅ Code Review bestanden
- ✅ Dokumentation aktualisiert

---

## Offene Fragen

1. Soll RetryServiceCompositionFactory als Singleton oder pro Service-Instanz sein?
2. Wie wird Service-Caching gehandhabt?
3. Soll RetryServiceCompositionFactory auch für andere Retry-Types verwendet werden?

---

## Referenzen

- [SOLID-Analyse: SRP](../Analyse/solid-01-single-responsibility-principle.md)
- [RetryService Source Code](../../src/infrastructure/retry/RetryService.ts)
- [BaseRetryService](../../src/infrastructure/retry/BaseRetryService.ts)
- [RetryObservabilityDecorator](../../src/infrastructure/retry/RetryObservabilityDecorator.ts)

---

**Letzte Aktualisierung:** 2025-12-10

