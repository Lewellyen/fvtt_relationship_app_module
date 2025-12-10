# OCP-Nachprüfung basierend auf Klassen-Übersicht

**Datum:** 2025-12-10  
**Ziel:** Vollständiger Abgleich aller in `docs/klassen-uebersicht.md` aufgeführten Klassen (aktuell 194) gegen das Open/Closed Principle (OCP) und vorhandene Refactoring-Vorschläge.
**Kontext:** Nutzeranforderung "OCP-Check über Klassenübersicht". Keine Code-Änderungen.

## Methodik
- Quelle für Klassenliste: vollständiger Durchlauf der 194 Klassen aus [`docs/klassen-uebersicht.md`](../klassen-uebersicht.md).
- Quervergleich mit bestehender OCP-Analyse (`docs/analysis/solid-02-open-closed-principle.md`) und Refactoring-Plänen in `docs/refactoring`.
- Fokus auf harte Kopplungen/harte Listen, die Erweiterungen nur per Modifikation erlauben.
- DI-/Decorator-/Strategy-basierte Klassen ohne starre Listen wurden als OCP-konform bewertet.

## Ergebnisse
### Kritische/partielle OCP-Verstöße (mit Klassendatei)
| Klasse | Datei | Beobachtung | Refactoring-Status |
| --- | --- | --- | --- |
| ModuleSettingsRegistrar | `src/application/services/ModuleSettingsRegistrar.ts` | Harte Liste aller Settings in `registerAll()` erzwingt Codeänderungen bei neuen Settings. | **Neu:** OCP-Plan in `docs/refactoring/12-ocp-module-settings-registrar.md` |
| InitOrchestrator | `src/framework/core/bootstrap/init-orchestrator.ts` | Reihenfolge und Menge der Bootstrappers sind fest verdrahtet; neue Phasen erfordern Codeänderung. | **Neu:** OCP-Plan in `docs/refactoring/13-ocp-init-orchestrator.md` |
| ModuleApiInitializer | `src/framework/core/api/module-api-initializer.ts` | `wrapSensitiveService` enthält feste Token-Prüfungen; neue Services brauchen Modifikation. | **Neu:** OCP-Plan in `docs/refactoring/14-ocp-module-api-initializer.md` (ergänzt SRP-Plan `05-module-api-initializer-srp-refactoring.md`) |
| PortSelector | `src/infrastructure/adapters/foundry/versioning/portselector.ts` | Version-Matching-Algorithmus hart kodiert; keine Strategie- oder Registry-Erweiterung. | SRP-Plan existiert (`04-port-selector-srp-refactoring.md`), **OCP-Plan ergänzt** in `docs/refactoring/15-ocp-port-selector.md` |
| MetricsCollector | `src/infrastructure/observability/metrics-collector.ts` | Feste Metrikfelder (containerResolutions, cacheHits …); neue Metriken erfordern Codeänderung. | SRP-Plan existiert (`02-metrics-collector-srp-refactoring.md`), **OCP-Plan ergänzt** in `docs/refactoring/16-ocp-metrics-collector.md` |
| FoundryJournalRepositoryAdapter | `src/infrastructure/adapters/foundry/repository-adapters/foundry-journal-repository-adapter.ts` | Mapping Foundry → Domain ist hart kodiert (id, name). Weitere Felder/Typen erfordern Modifikation. | SRP-Plan existiert (`06-foundry-journal-repository-adapter-srp-refactoring.md`), **OCP-Plan ergänzt** in `docs/refactoring/17-ocp-foundry-journal-repository-adapter.md` |

### Klassen ohne OCP-Risiken
- Alle weiteren in der Klassenübersicht aufgeführten Klassen sind entweder reine DI-Wrapper, nutzen Strategy/Decorator/Registry-Patterns oder sind abstrakte Basen ohne harte Listen. Sie gelten nach vollständigem Durchlauf als OCP-konform.

## Abgleich mit bestehenden Refactoring-Dokumenten
- Bestehende SRP-Pläne decken einige betroffene Klassen bereits funktional ab, adressieren jedoch nicht explizit OCP-Erweiterbarkeit (z. B. dynamische Registries).  
- Für alle oben genannten Verstöße wurde ein ergänzender OCP-Refactoring-Plan erstellt (`docs/refactoring/11-ocp-hardening.md`).  
- Keine weiteren OCP-spezifischen Lücken gefunden.

## Nächste Schritte
1. OCP-Pläne aus `docs/refactoring/11-ocp-hardening.md` priorisieren (Settings, Bootstrap-Orchestrierung, API-Wrapping).  
2. Umsetzung parallel zu bestehenden SRP-Refactorings planen, um Dopplungen zu vermeiden (z. B. PortSelector).  
3. Nach Umsetzung erneute OCP-Stichprobe durchführen und Klassenübersicht aktualisieren.
