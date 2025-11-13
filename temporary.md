# Bootstrap Timeline (Temporary Notes)

> Snapshot für die laufende Refactoring-Runde. Beschreibt, wann welche Klasse registriert oder instanziiert wird und welche Registrierungsart (`class`, `value`, `fallback`) verwendet wird.

## Phase 0 – Wrapper Layout
- Jeder DI-Wrapper (`DIConsoleLoggerService`, `DINotificationCenter`, `DITranslationHandlerChain`, `DIContainerHealthCheck`, `DIMetricsHealthCheck`, `DIPortSelectionEventEmitter`) steht im selben File **direkt nach** der zugehörigen Basisklasse.
- Wrapper enthalten ausschließlich `static dependencies` und leiten den Konstruktor 1:1 an die Basisklasse weiter. Tests und Bootstrap-Fallbacks instanziieren die Basisklasse weiterhin direkt per `new`.

## Phase 1 – Container-Erstellung
1. `ServiceContainer.createRoot()` – liefert leeren Container (Lifecycle: `SINGLETON` Registry).
2. `configureDependencies(container)` orchestriert alle Registrierungs-Schritte (siehe `src/config/dependencyconfig.ts`).

## Phase 2 – Fallback & Bootstrap Values
| Schritt | Methode | Token | Registrierung | Zweck |
|--------|---------|-------|----------------|-------|
| 2.1 | `registerFallbacks` | `loggerToken` | `registerFallback` | Notfall-Logger (`new ConsoleLoggerService(fallbackConfig)`) |
| 2.2 | `registerStaticValues` | `environmentConfigToken`, `serviceContainerToken` | `registerValue` | Bootstrap-Umgebung und Container-Self-Reference |
| 2.3 | `registerSubcontainerValues` | Foundry Port Registries | `registerValue` | Vorvalidierte Port-Factories (Subcontainer) |

## Phase 3 – Module Registrations (alle via `registerClass`)
1. **Core Services** (`core-services.config.ts`):  
   - `MetricsCollector`, `TraceContext`, `DIConsoleLoggerService`, `HealthCheckRegistry`, `ModuleHealthService`, `ModuleApiInitializer`  
   - Logger-Wrapper zieht `EnvironmentConfig` + `TraceContext` via `static dependencies`.
2. **Observability** (`observability.config.ts`):  
   - `DIPortSelectionEventEmitter` (`TRANSIENT`), `ObservabilityRegistry` (`SINGLETON`).  
   - PortSelector erhält pro Instanz einen eigenen EventEmitter.
3. **Utility + Port Infrastructure + Foundry Services**:  
   - Standard-`registerClass`-Registrierungen ohne Factories.
4. **I18n Services** (`i18n-services.config.ts`):  
   - Handler (`Foundry`, `Local`, `Fallback`) + `DITranslationHandlerChain`. Wrapper verlinkt Handler in der gewünschten Reihenfolge.
5. **Notifications** (`notifications.config.ts`):  
   - Channels (`ConsoleChannel`, `UIChannel`) + `DINotificationCenter`.
6. **Registrars**: Module-/Hook-Registrare.

## Phase 4 – Validation & Loop-Prevention
1. `registerLoopPreventionServices`  
   - `DIContainerHealthCheck`, `DIMetricsHealthCheck` (`SINGLETON`) registrieren sich beim `HealthCheckRegistry`.
2. `container.validate()` – Graph-Prüfung, keine Instanziierung.
3. `initializeLoopPreventionValues` – löst `HealthCheckRegistry`, `MetricsCollector`, beide HealthChecks auf (safe nach Validation).

## Phase 5 – Foundry Hooks
- `Hooks.on("init")`: Registrare aus dem Container auflösen, Module API freischalten.
- `Hooks.on("ready")`: Modul vollständig betriebsbereit.

---

Diese Datei dient nur als temporäre Referenz für das laufende Refactoring und wird nach Abschluss wieder entfernt oder in die endgültige Dokumentation überführt.

