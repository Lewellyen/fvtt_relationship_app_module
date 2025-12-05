# SRP Refactoring - Übersicht

**Status:** 📋 Geplant
**Erstellt:** 2025-01-XX
**Zweck:** Übersicht über alle SRP-Refactoring-Pläne

---

## Einleitung

Diese Übersicht dokumentiert alle identifizierten Single Responsibility Principle (SRP) Verletzungen im Projekt und die zugehörigen Refactoring-Pläne.

**SRP-Prinzip:** Eine Klasse sollte nur einen Grund zur Änderung haben. Jede Klasse hat eine einzige Verantwortlichkeit.

---

## Identifizierte SRP-Verletzungen

| # | Klasse | Priorität | Status | Refactoring-Plan |
|---|--------|-----------|--------|------------------|
| 1 | `JournalVisibilityService` | 🔴 Hoch | 📋 Geplant | [SRP-REFACTORING-01](./SRP-REFACTORING-01-JOURNAL-VISIBILITY-SERVICE.md) |
| 2 | `ModuleSettingsRegistrar` | 🟡 Niedrig | 📋 Geplant | [SRP-REFACTORING-02](./SRP-REFACTORING-02-MODULE-SETTINGS-REGISTRAR.md) |
| 3 | `CacheService` | 🟡 Mittel | 📋 Geplant | [SRP-REFACTORING-03](./SRP-REFACTORING-03-CACHE-SERVICE.md) |
| 4 | `ServiceResolver` | 🟡 Niedrig | 📋 Geplant | [SRP-REFACTORING-04](./SRP-REFACTORING-04-SERVICE-RESOLVER.md) |
| 5 | `MetricsCollector` | 🟡 Niedrig | 📋 Geplant | [SRP-REFACTORING-05](./SRP-REFACTORING-05-METRICS-COLLECTOR.md) |
| 6 | `PortSelector` | 🟡 Niedrig | 📋 Geplant | [SRP-REFACTORING-06](./SRP-REFACTORING-06-PORT-SELECTOR.md) |

---

## Priorisierung

### 🔴 Hoch (Sofort angehen)

1. **JournalVisibilityService**
   - **Problem:** Vermischt Business-Logik, DOM-Manipulation, Caching und HTML-Sanitization
   - **Impact:** Schwer testbar, schlechte Wartbarkeit
   - **Lösung:** Trennung in `JournalVisibilityService` (Business-Logik) und `JournalDirectoryProcessor` (DOM-Verarbeitung)

### 🟡 Mittel (Nächste Iteration)

2. **CacheService**
   - **Problem:** Vermischt Cache-Operationen, Capacity-Management und Metrics-Tracking
   - **Impact:** LRU-Algorithmus nicht austauschbar, schwer testbar
   - **Lösung:** Trennung in `CacheService` (Core), `CacheCapacityManager` (LRU) und `CacheMetricsCollector` (Metrics)

### 🟡 Niedrig (Später)

3. **ModuleSettingsRegistrar**
   - **Problem:** Vermischt Settings-Registrierung und RuntimeConfig-Synchronisation
   - **Impact:** Gering, aber verbesserbar
   - **Lösung:** Trennung in `ModuleSettingsRegistrar` (Settings) und `RuntimeConfigSync` (Sync)

4. **ServiceResolver**
   - **Problem:** Vermischt Resolution, Lifecycle-Management und Metrics
   - **Impact:** Gering, aber verbesserbar
   - **Lösung:** Trennung in `ServiceResolver` (Core), `LifecycleResolver` (Lifecycle) und `ServiceInstantiator` (Instanziierung)

5. **MetricsCollector**
   - **Problem:** Vermischt Collection, Sampling und Reporting
   - **Impact:** Gering, aber verbesserbar
   - **Lösung:** Trennung in `MetricsCollector` (Collection), `MetricsSampler` (Sampling) und `MetricsReporter` (Reporting)

6. **PortSelector**
   - **Problem:** Vermischt Port-Auswahl und Version-Detection
   - **Impact:** Sehr gering, Version-Detection bereits vorhanden
   - **Lösung:** Trennung in `PortSelector` (Auswahl) und `FoundryVersionDetector` (Version)

---

## Refactoring-Strategie

### Allgemeine Vorgehensweise

1. **Phase 1: Neue Klassen extrahieren**
   - Neue Klassen mit fokussierten Verantwortlichkeiten erstellen
   - DI-Wrapper und Tokens erstellen
   - In DI-Config registrieren

2. **Phase 2: Original-Klasse refactoren**
   - Verantwortlichkeiten delegieren
   - Alte Methoden entfernen
   - Dependencies injizieren

3. **Phase 3: Tests aktualisieren**
   - Unit-Tests für neue Klassen schreiben
   - Unit-Tests für refactorierte Klasse aktualisieren
   - Integration-Tests aktualisieren

4. **Phase 4: Dokumentation**
   - API-Dokumentation aktualisieren
   - CHANGELOG.md aktualisieren
   - Migration-Guides erstellen (falls Breaking Changes)

### Breaking Changes

| Refactoring | Breaking Changes | Migration nötig |
|-------------|------------------|-----------------|
| JournalVisibilityService | ✅ Ja (`processJournalDirectory()` entfernt) | ✅ Ja |
| ModuleSettingsRegistrar | ❌ Nein | ❌ Nein |
| CacheService | ❌ Nein | ❌ Nein |
| ServiceResolver | ❌ Nein | ❌ Nein |
| MetricsCollector | ✅ Ja (`shouldSample()`, `logSummary()` entfernt) | ✅ Ja |
| PortSelector | ❌ Nein | ❌ Nein |

---

## Vorteile der Refactorings

### Allgemeine Vorteile

1. ✅ **SRP-Konformität**: Jede Klasse hat eine einzige Verantwortlichkeit
2. ✅ **Bessere Testbarkeit**: Isolierte Tests für einzelne Concerns
3. ✅ **Wiederverwendbarkeit**: Komponenten können in anderen Kontexten genutzt werden
4. ✅ **Klarere Abhängigkeiten**: Explizite Dependencies statt versteckte Verantwortlichkeiten
5. ✅ **Einfachere Wartung**: Änderungen betreffen nur relevante Klassen
6. ✅ **Austauschbarkeit**: Strategien können ausgetauscht werden (z.B. LRU → FIFO)

### Spezifische Vorteile

- **JournalVisibilityService**: DOM-Manipulation ohne Business-Logik testbar
- **CacheService**: Eviction-Strategien austauschbar (LRU, FIFO, LFU)
- **ServiceResolver**: Lifecycle-Strategien austauschbar
- **MetricsCollector**: Sampling-Strategien austauschbar

---

## Risiken

### Allgemeine Risiken

1. **Niedrig**: Tests müssen angepasst werden
2. **Niedrig**: DI-Config muss aktualisiert werden
3. **Mittel**: Breaking Changes bei `JournalVisibilityService` und `MetricsCollector`

### Spezifische Risiken

- **JournalVisibilityService**: Use-Cases müssen aktualisiert werden
- **MetricsCollector**: Externe API-Nutzer müssen migriert werden
- **ServiceResolver**: Zirkuläre Dependency zwischen Resolver und LifecycleResolver (lösbar)

---

## Implementierungsreihenfolge

### Empfohlene Reihenfolge

1. **JournalVisibilityService** (Hoch)
   - Größte SRP-Verletzung
   - Deutliche Verbesserung der Testbarkeit
   - Breaking Changes akzeptabel (Pre-Release)

2. **CacheService** (Mittel)
   - Gute Verbesserung der Architektur
   - Keine Breaking Changes
   - Eviction-Strategien austauschbar

3. **ModuleSettingsRegistrar** (Niedrig)
   - Kleine Verbesserung
   - Keine Breaking Changes
   - Schnell umsetzbar

4. **MetricsCollector** (Niedrig)
   - Breaking Changes (API-Änderungen)
   - Bessere Trennung von Concerns
   - Sampling-Strategien austauschbar

5. **ServiceResolver** (Niedrig)
   - Komplexe Refaktorierung
   - Keine Breaking Changes
   - Lifecycle-Strategien austauschbar

6. **PortSelector** (Niedrig)
   - Sehr kleine Verbesserung
   - Keine Breaking Changes
   - Version-Detection bereits vorhanden

---

## Checkliste für jedes Refactoring

- [ ] Refactoring-Plan gelesen und verstanden
- [ ] Neue Klassen erstellt
- [ ] DI-Wrapper und Tokens erstellt
- [ ] In DI-Config registriert
- [ ] Original-Klasse refactoriert
- [ ] Alte Methoden entfernt
- [ ] Unit-Tests für neue Klassen geschrieben
- [ ] Unit-Tests für refactorierte Klasse aktualisiert
- [ ] Integration-Tests aktualisiert
- [ ] API-Dokumentation aktualisiert
- [ ] CHANGELOG.md aktualisiert
- [ ] Migration-Guide erstellt (falls Breaking Changes)
- [ ] Code-Review durchgeführt

---

## Weiterführende Dokumentation

- **SRP-Prinzip:** [Wikipedia - Single Responsibility Principle](https://en.wikipedia.org/wiki/Single-responsibility_principle)
- **SOLID-Prinzipien:** [ARCHITECTURE.md](../ARCHITECTURE.md)
- **Refactoring-Guides:** [docs/refactoring/](./)

---

## Status-Tracking

| Refactoring | Status | Startdatum | Abschlussdatum | Notizen |
|-------------|--------|------------|----------------|---------|
| JournalVisibilityService | 📋 Geplant | - | - | - |
| ModuleSettingsRegistrar | 📋 Geplant | - | - | - |
| CacheService | 📋 Geplant | - | - | - |
| ServiceResolver | 📋 Geplant | - | - | - |
| MetricsCollector | 📋 Geplant | - | - | - |
| PortSelector | 📋 Geplant | - | - | - |

---

**Letzte Aktualisierung:** 2025-01-XX

