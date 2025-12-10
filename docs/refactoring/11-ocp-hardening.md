# Refactoring-Plan: OCP-Härtung (ergänzend zu SRP-Plänen)

**Datum:** 2025-12-10  
**Ziel:** OCP-Verletzungen aus `docs/klassen-uebersicht.md` beseitigen, ohne bestehende SRP-Pläne zu duplizieren. Fokus: Erweiterbarkeit über Registries/Strategien statt harte Listen/If-Ketten. Die nachfolgenden Leitplanken verweisen auf die Einzelpläne `12`–`17`.

## 1) ModuleSettingsRegistrar – registrierbare Settings
- **Problem:** `registerAll()` enthält fixe Liste aller Settings. Jede neue Einstellung erzwingt Codeänderung.  
- **Maßnahme:**
  - `ModuleSettingsRegistrar` in einen Registry-Konsumenten verwandeln: Liste `SettingDefinition` via DI injizieren (z. B. `SettingDefinitionRegistry`).
  - `RuntimeConfigBinding`-Brücke ebenfalls über Mapping injizieren, nicht über `runtimeConfigBindings`-Konstante.
  - `registerAll()` iteriert nur über injizierte Definitionen → offen für neue Settings, geschlossen für Modifikationen.
- **Abhängigkeit:** Ergänzt SRP-Plan `07-module-settings-registrar-srp-refactoring.md` (Komposition/Sync).

## 2) InitOrchestrator – Bootstrapper-Registry
- **Problem:** Feste Orchestrierungsschritte in `InitOrchestrator.execute`. Neue Phasen erfordern Codeänderung.
- **Maßnahme:**
  - `InitPhase`-Interface einführen (Name, Kritikalität, Execute-Funktion).
  - `InitOrchestrator` konsumiert eine via DI bereitgestellte geordnete `InitPhase[]` oder Priority-Queue.
  - Fehlerhandling (kritisch/optional) in Phase-Modell kapseln, Orchestrator iteriert nur.
- **Hinweis:** Kombinierbar mit Observability (Phase-Events) ohne Core-Code anzupassen.

## 3) ModuleApiInitializer – Wrapper-Strategien
- **Problem:** `wrapSensitiveService` prüft feste Tokens (`i18n`, `notification`, `settings`). Neue Services erzwingen Codeänderung.
- **Maßnahme:**
  - `ApiWrapperStrategy`-Interface (supports(token), wrap(service)) definieren.
  - Strategien via DI registrieren; `wrapSensitiveService` iteriert über Strategien (first match) und ist selbst geschlossen für Änderungen.
- **Abhängigkeit:** Ergänzt SRP-Plan `05-module-api-initializer-srp-refactoring.md` (Aufteilung Builder/Wrapper).

## 4) PortSelector – austauschbare Matching-Strategie
- **Problem:** Version-Matching-Algorithmus fest im Code (`greedy highest <= version`). Keine Variation möglich.
- **Maßnahme:**
  - `PortMatchStrategy`-Interface einführen (select(tokens, version)): Result<{token, selectedVersion}>.
  - Standard-Strategie bleibt Greedy; weitere Strategien (z. B. "exact only", "LTS fallback") können registriert werden.
  - `PortSelector` konsumiert Strategie via DI oder Constructor-Parameter; Events/Resolution bleiben unverändert.
- **Abhängigkeit:** Ergänzt SRP-Plan `04-port-selector-srp-refactoring.md` (Trennung Auswahl/Observability).

## 5) MetricsCollector – dynamische Metrik-Registrierung
- **Problem:** Feste Felder für Metrics (containerResolutions, cacheHits …). Neue Metriken erfordern Codeänderung.
- **Maßnahme:**
  - `MetricDefinition`-Registry einführen (Name, Initialwert, Reducer/Aggregator, Snapshot-Serializer).
  - `MetricsCollector` hält generische Map<string, MetricState>; spezialisierte Recorder delegieren an registrierte Definitionen.
  - Snapshot/Persistence iterieren über registrierte Definitionen statt feste Felder.
- **Abhängigkeit:** Ergänzt SRP-Plan `02-metrics-collector-srp-refactoring.md` (Trennung Sammlung/Aggregation).

## 6) FoundryJournalRepositoryAdapter – Mapper-Registry
- **Problem:** Mapping Foundry → Domain (id, name) ist hart kodiert; weitere Felder/Varianten brauchen Codeänderung.
- **Maßnahme:**
  - `JournalMapper`-Interface einführen (supports(foundryEntity), toDomain(foundryEntity)).
  - Adapter injiziert Mapper-Registry und delegiert Mapping an erste passende Strategie.
  - Erweiterbar für weitere Entity-Typen/Flags ohne Änderung des Adapters.
- **Abhängigkeit:** Ergänzt SRP-Plan `06-foundry-journal-repository-adapter-srp-refactoring.md` (Trennung Collection/Repository/Mapping).

## 7) ServiceContainer – Validierungs-Strategien (optional)
- **Problem:** Validierungslogik für Registrierungen teilweise hart kodiert (z. B. Lebenszyklusregeln).
- **Maßnahme:**
  - Validierungskette via `ContainerValidator`-Interface und Registry injizieren.
  - Container ruft nur die Kette auf; neue Regeln werden über DI ergänzt, nicht per Codeänderung.
- **Abhängigkeit:** Ergänzt SRP-Plan `01-service-container-srp-refactoring.md`.

## Priorisierung
1. ModuleSettingsRegistrar → hoher Änderungsdruck durch neue Settings.  
2. InitOrchestrator & ModuleApiInitializer → blockieren neue Phasen/Services.  
3. PortSelector & MetricsCollector → mittelfristig für Versionierung/Observability nötig.  
4. FoundryJournalRepositoryAdapter & ServiceContainer → nachziehen, sobald Grund-Registries stehen.

## Erfolgskriterien
- Neue Settings/Bootstrapper/Wrapper/Metriken können ohne Codeänderung in Kernklassen ergänzt werden.  
- OCP-Änderungen verletzen SRP-Pläne nicht (Komposition über DI).  
- Tests decken Standard-Strategien ab; zusätzliche Strategien über Mocks/Factories validiert.  
- Keine Änderung an Public API/Token-Oberflächen.
