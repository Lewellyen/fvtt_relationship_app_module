# Refactoring-Plan: CompositionRoot SRP-Verletzung

**Erstellungsdatum:** 2025-12-10
**Status:** Geplant
**Priorität:** Mittel
**Betroffene Datei:** `src/framework/core/composition-root.ts`

---

## Problem-Beschreibung

Die `CompositionRoot`-Klasse verletzt das Single Responsibility Principle (SRP) mit 4 verschiedenen Verantwortlichkeiten:

1. **Container-Erstellung** (`ServiceContainer.createRoot()`)
2. **Dependency-Konfiguration** (`configureDependencies()`)
3. **Performance-Tracking** (`BootstrapPerformanceTracker.track()`)
4. **Error-Handling/Logging** (Bootstrap-Logger für Fehler)

**Aktuelle Architektur:**
- CompositionRoot erstellt Container
- Führt Dependency-Konfiguration durch
- Trackt Performance inline
- Handhabt Error-Logging direkt

**Problem:** Container-Erstellung, Konfiguration, Performance-Tracking und Error-Handling sind unterschiedliche Verantwortlichkeiten, die getrennt werden sollten.

---

## Ziel-Architektur

### Neue Klassen-Struktur

```
CompositionRoot (Facade - nur Koordination)
├── ContainerFactory (nur Container-Erstellung)
│   └── createRoot() → ServiceContainer
├── DependencyConfigurator (nur Dependency-Konfiguration)
│   └── configure(container) → Result
├── BootstrapPerformanceTracker (bereits vorhanden)
│   └── track() → Performance-Tracking
└── BootstrapErrorHandler (bereits vorhanden)
    └── handleError() → Error-Handling
```

### Verantwortlichkeiten

| Klasse | Verantwortlichkeit | Methoden |
|--------|-------------------|----------|
| `CompositionRoot` | Nur Koordination | `bootstrap()`, `getContainer()` - delegiert zu allen Komponenten |
| `ContainerFactory` | Nur Container-Erstellung | `createRoot()` |
| `DependencyConfigurator` | Nur Dependency-Konfiguration | `configure()` |
| `BootstrapPerformanceTracker` | Nur Performance-Tracking | `track()` (bereits vorhanden) |
| `BootstrapErrorHandler` | Nur Error-Handling | `handleError()` (bereits vorhanden) |

---

## Schritt-für-Schritt Refactoring-Plan

### Phase 1: Vorbereitung (Tests & Interfaces)

1. **Tests für aktuelle Funktionalität schreiben**
   - Alle Public-Methoden von CompositionRoot testen
   - Container-Erstellung testen
   - Dependency-Konfiguration testen
   - Performance-Tracking testen
   - Error-Handling testen

2. **Interfaces definieren**
   ```typescript
   interface IContainerFactory {
     createRoot(env: EnvironmentConfig): ServiceContainer;
   }

   interface IDependencyConfigurator {
     configure(container: ServiceContainer): Result<void, string>;
   }
   ```

### Phase 2: Neue Klassen erstellen

3. **ContainerFactory erstellen**
   - Datei: `src/framework/core/factory/container-factory.ts`
   - Implementiert `IContainerFactory`
   - Enthält `ServiceContainer.createRoot()` Logik
   - Tests schreiben

4. **DependencyConfigurator erstellen**
   - Datei: `src/framework/core/config/dependency-configurator.ts`
   - Implementiert `IDependencyConfigurator`
   - Enthält `configureDependencies()` Logik
   - Tests schreiben

### Phase 3: CompositionRoot refactoren

5. **CompositionRoot umbauen**
   - Alle Komponenten als Dependencies injizieren
   - CompositionRoot wird zur reinen Facade
   - `bootstrap()` delegiert zu allen Komponenten:
     - ContainerFactory erstellt Container
     - BootstrapPerformanceTracker trackt Performance
     - DependencyConfigurator konfiguriert Dependencies
     - BootstrapErrorHandler handhabt Fehler
   - `getContainer()` bleibt unverändert

6. **Constructor anpassen**
   - ContainerFactory als Parameter
   - DependencyConfigurator als Parameter
   - BootstrapPerformanceTracker als Parameter (optional, kann intern erstellt werden)
   - BootstrapErrorHandler als Parameter (optional, kann intern erstellt werden)

### Phase 4: Integration & Tests

7. **Integration Tests**
   - CompositionRoot mit allen Komponenten zusammen testen
   - Vollständiger Flow: Create → Track → Configure → Error-Handling
   - Alle Komponenten koordinieren korrekt

8. **Performance Tests**
   - Sicherstellen, dass keine Performance-Regression auftritt

---

## Migration-Strategie

### Backward Compatibility

- **Public API bleibt unverändert**: `bootstrap()` und `getContainer()` bleiben erhalten
- **Interne Implementierung ändert sich**: Nur interne Struktur wird refactored
- **Keine Breaking Changes**: Externe Consumer merken keine Änderung

### Rollout-Plan

1. **Feature Branch erstellen**: `refactor/composition-root-srp`
2. **Komponenten-Klassen implementieren**: Parallel zu bestehendem Code
3. **CompositionRoot schrittweise umbauen**: Factory → Configurator → Performance → Error
4. **Tests durchlaufen lassen**: Alle Tests müssen grün sein
5. **Code Review**: Review der Refactoring-Änderungen
6. **Merge**: In Main-Branch mergen

---

## Tests

### Unit Tests

- **ContainerFactory**
  - `createRoot()` erstellt korrekten Container
  - Verschiedene Environment-Configs

- **DependencyConfigurator**
  - `configure()` konfiguriert Dependencies korrekt
  - Error-Handling bei fehlgeschlagener Konfiguration

- **CompositionRoot (refactored)**
  - `bootstrap()` delegiert korrekt zu allen Komponenten
  - `getContainer()` gibt korrekten Container zurück
  - Koordination funktioniert

### Integration Tests

- **CompositionRoot als Facade**
  - Vollständiger Flow: Create → Track → Configure → Error-Handling
  - Alle Komponenten koordinieren korrekt
  - Container wird korrekt erstellt und konfiguriert

### Regression Tests

- Alle bestehenden Tests müssen weiterhin funktionieren
- Keine Performance-Regression

---

## Breaking Changes

**Keine Breaking Changes erwartet**

- Public API von `CompositionRoot` bleibt unverändert
- Interne Implementierung ändert sich nur
- Externe Consumer merken keine Änderung

---

## Risiken

### Technische Risiken

1. **Performance-Regression**
   - **Risiko**: Zusätzliche Delegation-Layer könnten Performance beeinträchtigen
   - **Mitigation**: Performance Tests durchführen, ggf. optimieren

2. **Koordinations-Fehler**
   - **Risiko**: Komponenten koordinieren nicht korrekt
   - **Mitigation**: Umfassende Integration Tests

3. **Bootstrap-Phase-Fehler**
   - **Risiko**: Bootstrap funktioniert nicht korrekt mit neuen Komponenten
   - **Mitigation**: Umfassende Tests für Bootstrap-Phase

### Projekt-Risiken

1. **Zeitaufwand**
   - **Risiko**: Refactoring dauert länger als erwartet
   - **Mitigation**: Schrittweise Vorgehen, Feature Branch

2. **Code-Review-Komplexität**
   - **Risiko**: Große PR mit vielen Änderungen
   - **Mitigation**: Kleine, inkrementelle Commits

---

## Erfolgs-Kriterien

- ✅ CompositionRoot ist reine Facade (nur Koordination)
- ✅ ContainerFactory verwaltet nur Container-Erstellung
- ✅ DependencyConfigurator verwaltet nur Dependency-Konfiguration
- ✅ BootstrapPerformanceTracker verwaltet nur Performance-Tracking
- ✅ BootstrapErrorHandler verwaltet nur Error-Handling
- ✅ Alle Tests bestehen (Unit + Integration)
- ✅ Keine Performance-Regression
- ✅ Keine Breaking Changes
- ✅ Code Review bestanden
- ✅ Dokumentation aktualisiert

---

## Offene Fragen

1. Sollen Komponenten als Singleton oder pro CompositionRoot-Instanz sein?
2. Wie wird Performance-Tracking mit Error-Handling synchronisiert?
3. Soll ContainerFactory auch für Child-Container-Erstellung zuständig sein?

---

## Referenzen

- [SOLID-Analyse: SRP](../Analyse/solid-01-single-responsibility-principle.md)
- [CompositionRoot Source Code](../../src/framework/core/composition-root.ts)
- [BootstrapPerformanceTracker](../../src/infrastructure/observability/bootstrap-performance-tracker.ts)
- [BootstrapErrorHandler](../../src/framework/core/bootstrap-error-handler.ts)

---

**Letzte Aktualisierung:** 2025-12-10

