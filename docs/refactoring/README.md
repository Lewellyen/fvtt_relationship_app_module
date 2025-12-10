# Refactoring-Dokumentation: SRP- und OCP-Verletzungen

**Erstellungsdatum:** 2025-12-10
**Zweck:** Detaillierte Refactoring-Pläne für alle identifizierten SRP- und OCP-Verletzungen

---

## Übersicht

Diese Dokumentation enthält detaillierte Refactoring-Pläne für alle 9 identifizierten SRP-Verletzungen aus der [SOLID-Analyse](../Analyse/solid-01-single-responsibility-principle.md) sowie ergänzende OCP-Härtungen aus `docs/analysis/solid-02-open-closed-principle.md` und `docs/analysis/2025-12-10-ocp-nachpruefung.md`.

## Refactoring-Pläne

### 1. ServiceContainer - God Object
**Priorität:** Hoch
**Datei:** [01-service-container-srp-refactoring.md](./01-service-container-srp-refactoring.md)

**Problem:** ServiceContainer hat 8+ verschiedene Verantwortlichkeiten (Registration, Validation, Resolution, Scope, Disposal, Metrics, API-Security, Token-Mapping).

**Lösung:** Aufteilen in Facade + separate Manager für jede Verantwortlichkeit.

---

### 2. MetricsCollector - Multiple Responsibilities
**Priorität:** Hoch
**Datei:** [02-metrics-collector-srp-refactoring.md](./02-metrics-collector-srp-refactoring.md)

**Problem:** MetricsCollector hat 4 Verantwortlichkeiten (Sammlung, Aggregation, Persistence, State).

**Lösung:** Aufteilen in MetricsCollector (Sammlung), MetricsAggregator (Aggregation), MetricsPersistenceManager (Persistence), MetricsStateManager (State).

---

### 3. CacheService - God Object
**Priorität:** Hoch
**Datei:** [03-cache-service-srp-refactoring.md](./03-cache-service-srp-refactoring.md)

**Problem:** CacheService hat 6 Verantwortlichkeiten (Storage, TTL, Capacity, Statistics, Metrics, Config).

**Lösung:** Aufteilen in CacheStore (Storage), CacheExpirationManager (TTL), CacheCapacityManager (Capacity), CacheStatisticsCollector (Statistics), CacheConfigManager (Config).

---

### 4. PortSelector - Multiple Concerns
**Priorität:** Mittel
**Datei:** [04-port-selector-srp-refactoring.md](./04-port-selector-srp-refactoring.md)

**Problem:** PortSelector hat 4 Verantwortlichkeiten (Port-Auswahl, Event-Emission, Self-Registration, Performance-Tracking).

**Lösung:** Aufteilen in PortSelector (Auswahl), PortSelectionObserver (Events), PortSelectionObservability (Registration), PortSelectionPerformanceTracker (Performance).

---

### 5. ModuleApiInitializer - Multiple Responsibilities
**Priorität:** Hoch
**Datei:** [05-module-api-initializer-srp-refactoring.md](./05-module-api-initializer-srp-refactoring.md)

**Problem:** ModuleApiInitializer hat 5 Verantwortlichkeiten (API-Erstellung, Wrapping, Deprecation, Resolution, Health).

**Lösung:** Aufteilen in ModuleApiBuilder (API-Erstellung), ServiceWrapperFactory (Wrapping), DeprecationHandler (Deprecation), ApiServiceResolver (Resolution), ApiHealthMetricsProvider (Health).

---

### 6. FoundryJournalRepositoryAdapter - Combines Collection + Repository
**Priorität:** Niedrig
**Datei:** [06-foundry-journal-repository-adapter-srp-refactoring.md](./06-foundry-journal-repository-adapter-srp-refactoring.md)

**Problem:** Kombiniert Collection UND Repository. Nutzt Delegation statt Composition.

**Lösung:** Composition statt Delegation, Type-Mapping extrahieren zu JournalTypeMapper.

---

### 7. ModuleSettingsRegistrar - Multiple Responsibilities
**Priorität:** Mittel
**Datei:** [07-module-settings-registrar-srp-refactoring.md](./07-module-settings-registrar-srp-refactoring.md)

**Problem:** ModuleSettingsRegistrar hat 3 Verantwortlichkeiten (Registrierung, Sync, Error-Handling).

**Lösung:** Aufteilen in ModuleSettingsRegistrar (Registrierung), RuntimeConfigSettingsSync (Sync), SettingRegistrationErrorMapper (Error-Handling - bereits vorhanden).

---

### 8. ConsoleLoggerService - Multiple Concerns
**Priorität:** Niedrig
**Datei:** [08-console-logger-service-srp-refactoring.md](./08-console-logger-service-srp-refactoring.md)

**Problem:** ConsoleLoggerService ist für Logger-Komposition verantwortlich, was eine separate Verantwortlichkeit ist.

**Lösung:** Komposition extrahieren zu LoggerCompositionFactory.

---

### 9. RetryService - Observability + Retry Logic
**Priorität:** Niedrig
**Datei:** [09-retry-service-srp-refactoring.md](./09-retry-service-srp-refactoring.md)

**Problem:** RetryService ist eine Wrapper-Klasse, die Retry-Algorithmus und Observability kombiniert.

**Lösung:** Vererbung → Komposition, RetryServiceCompositionFactory erstellen.

---

### 10. CompositionRoot - Multiple Responsibilities
**Priorität:** Mittel
**Datei:** [10-composition-root-srp-refactoring.md](./10-composition-root-srp-refactoring.md)

**Problem:** CompositionRoot hat 4 Verantwortlichkeiten (Container-Erstellung, Dependency-Konfiguration, Performance-Tracking, Error-Handling).

**Lösung:** Aufteilen in ContainerFactory, DependencyConfigurator, BootstrapPerformanceTracker, BootstrapErrorHandler.

---

### 11. OCP-Härtung – Überblick & Leitplanken
**Priorität:** Mittel
**Datei:** [11-ocp-hardening.md](./11-ocp-hardening.md)

**Problem:** Mehrere Kernklassen nutzen harte Listen/Algorithmen und benötigen OCP-Härtung.

**Lösung:** Leitplanken und gemeinsame Muster für die OCP-Pläne 12–17 (Registry-/Strategie-Ansatz, DI-first, Tests für Erweiterbarkeit).

---

### 12. ModuleSettingsRegistrar – OCP: registrierbare Settings
**Priorität:** Mittel
**Datei:** [12-ocp-module-settings-registrar.md](./12-ocp-module-settings-registrar.md)

**Problem:** Harte Setting- und Binding-Listen in `registerAll()` verhindern Erweiterbarkeit.

**Lösung:** Registry-basierte Settings- und Binding-Definitionen; Registrar iteriert nur über injizierte Registries.

---

### 13. InitOrchestrator – OCP: Bootstrapper-Registry
**Priorität:** Mittel
**Datei:** [13-ocp-init-orchestrator.md](./13-ocp-init-orchestrator.md)

**Problem:** Feste Bootstrapper-Reihenfolge; neue Phasen erfordern Codeänderung.

**Lösung:** InitPhasen als Registry/Interface; Orchestrator iteriert nur über registrierte Phasen inkl. Fehlerstrategie.

---

### 14. ModuleApiInitializer – OCP: Wrapper-Strategien
**Priorität:** Mittel
**Datei:** [14-ocp-module-api-initializer.md](./14-ocp-module-api-initializer.md)

**Problem:** Token-spezifische If/Else-Ketten für API-Wrapping.

**Lösung:** Strategy-Registry (`ApiWrapperStrategy`) für Tokens/Services; Initializer delegiert nur noch an Strategien.

---

### 15. PortSelector – OCP: austauschbare Matching-Strategie
**Priorität:** Mittel
**Datei:** [15-ocp-port-selector.md](./15-ocp-port-selector.md)

**Problem:** Hart codierte greedy-Matching-Logik.

**Lösung:** `PortMatchStrategy`-Injection/Registry; Selector bleibt unverändert bei neuen Matching-Varianten.

---

### 16. MetricsCollector – OCP: dynamische Metrik-Registrierung
**Priorität:** Mittel
**Datei:** [16-ocp-metrics-collector.md](./16-ocp-metrics-collector.md)

**Problem:** Feste Metrik-Properties und Snapshot/Persistence an konkrete Felder gekoppelt.

**Lösung:** `MetricDefinition`-Registry und generischer Collector/Snapshotter ohne hartkodierte Properties.

---

### 17. FoundryJournalRepositoryAdapter – OCP: Mapper-Registry
**Priorität:** Niedrig
**Datei:** [17-ocp-foundry-journal-repository-adapter.md](./17-ocp-foundry-journal-repository-adapter.md)

**Problem:** Hartes Field-Mapping id/name; neue Varianten erfordern Codeänderung.

**Lösung:** `JournalMapper`-Registry mit priorisierten Strategien für Mapping-Varianten.

---

## Priorisierung

### Hoch (sofort angehen)
1. ServiceContainer - God Object (8+ Verantwortlichkeiten)
2. MetricsCollector - Multiple Responsibilities (4 Verantwortlichkeiten)
3. CacheService - God Object (6 Verantwortlichkeiten)
4. ModuleApiInitializer - Multiple Responsibilities (5 Verantwortlichkeiten)

### Mittel (bald angehen)
5. PortSelector - Multiple Concerns (4 Verantwortlichkeiten)
6. ModuleSettingsRegistrar - Multiple Responsibilities (3 Verantwortlichkeiten)

### Mittel (bald angehen)
10. CompositionRoot - Multiple Responsibilities (4 Verantwortlichkeiten)

### Niedrig (später angehen)
7. FoundryJournalRepositoryAdapter - Combines Collection + Repository
8. ConsoleLoggerService - Multiple Concerns
9. RetryService - Observability + Retry Logic

### OCP (neu) – Erweiterbarkeit absichern
- 12. ModuleSettingsRegistrar – Registry-basierte Settings/Bindings
- 13. InitOrchestrator – Registry-basierte Bootstrap-Phasen
- 14. ModuleApiInitializer – Strategy-basiertes API-Wrapping
- 15. PortSelector – austauschbare Matching-Strategie
- 16. MetricsCollector – dynamische Metrik-Registrierung
- 17. FoundryJournalRepositoryAdapter – Mapper-Registry

---

## Gemeinsame Muster

### 1. God Objects aufteilen
- **ServiceContainer**: Facade + Manager-Klassen
- **CacheService**: Facade + Manager-Klassen
- **ModuleApiInitializer**: Facade + Komponenten-Klassen

### 2. Komposition statt Vererbung
- **RetryService**: Vererbung → Komposition
- **FoundryJournalRepositoryAdapter**: Delegation → Composition

### 3. Factory-Pattern für Komposition
- **ConsoleLoggerService**: LoggerCompositionFactory
- **RetryService**: RetryServiceCompositionFactory

### 4. Manager-Klassen für spezifische Verantwortlichkeiten
- **MetricsCollector**: MetricsAggregator, MetricsPersistenceManager, MetricsStateManager
- **CacheService**: CacheStore, CacheExpirationManager, CacheStatisticsCollector, CacheConfigManager

---

## Implementierungs-Strategie

### Schrittweise Vorgehen
1. **Tests schreiben** für aktuelle Funktionalität
2. **Interfaces definieren** für neue Komponenten
3. **Neue Klassen erstellen** parallel zu bestehendem Code
4. **Refactoring schrittweise** durchführen
5. **Tests durchlaufen lassen** nach jedem Schritt
6. **Code Review** durchführen
7. **Merge** in Main-Branch

### Backward Compatibility
- **Public API bleibt unverändert** bei allen Refactorings
- **Interne Implementierung ändert sich** nur
- **Keine Breaking Changes** für externe Consumer

---

## Erfolgs-Kriterien

Für jedes Refactoring:
- ✅ Alle Manager/Komponenten-Klassen implementiert
- ✅ Hauptklasse ist reine Facade oder hat nur eine Verantwortlichkeit
- ✅ Alle Tests bestehen (Unit + Integration)
- ✅ Keine Performance-Regression
- ✅ Keine Breaking Changes
- ✅ Code Review bestanden
- ✅ Dokumentation aktualisiert

---

## Referenzen

- [SOLID-Analyse: SRP](../Analyse/solid-01-single-responsibility-principle.md)
- [SOLID-Analyse: OCP](../Analyse/solid-02-open-closed-principle.md)
- [SOLID-Analyse: LSP](../Analyse/solid-03-liskov-substitution-principle.md)
- [Architektur-Dokumentation](../architecture/)

---

**Letzte Aktualisierung:** 2025-12-10

