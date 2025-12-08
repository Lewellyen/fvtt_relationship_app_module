# Single Responsibility Principle (SRP) Review

## Scope
Ziel der Analyse ist eine SRP-Bewertung des Moduls. Untersucht wurden exemplarisch Infrastruktur- und Application-Services, die zentrale Aufgaben ausführen oder Cross-Cutting-Concerns bündeln.

## Befunde

### 1) ModuleSettingsRegistrar bündelt Registrierung, RuntimeConfig-Brücke und Fehlerabbildung
- **Mehrfachverantwortung:** `registerAll` orchestriert die Definitionen, `registerDefinition` baut zusätzlich die RuntimeConfig-Synchronisation an und mappt Fehler für Notifications. Änderungen an Settings, RuntimeConfig-Bindings oder Fehlerformaten wirken alle auf diese Klasse. 【F:src/application/services/ModuleSettingsRegistrar.ts†L48-L185】
- **SRP-Risiko:** Registrierung (welche Settings es gibt) und RuntimeConfig-Bridge (wie Werte synchronisiert werden) sind voneinander unabhängige Gründe zur Änderung. Eine separate Komponente für die Bridge würde die Klasse schlanker halten.

### 2) ConsoleLoggerService koppelt Logging, RuntimeConfig-Listener und Trace-Kontext
- **Mehrfachverantwortung:** Die Klasse schreibt Console-Logs, verwaltet aber auch den Log-Level über eine RuntimeConfig-Subscription und kümmert sich um Trace-ID-Formatierung. 【F:src/infrastructure/logging/ConsoleLoggerService.ts†L13-L79】
- **SRP-Risiko:** Änderungen an Konfigurationsbeobachtung oder Tracing betreffen dieselbe Klasse wie reine Logging-Anpassungen. Ein getrenntes Responsibility-Splitting (z. B. Konfigurations-Decorator + Trace-Decorator um einen schlanken Logger-Kern) würde das ändern.

### 3) RetryService vereint Retry-Strategie und Observability-Concerns
- **Mehrfachverantwortung:** Neben dem Retry-Algorithmus übernimmt die Klasse Timing-Messung und Log-Ausgaben für Versuche und Metriken. 【F:src/infrastructure/retry/RetryService.ts†L103-L315】
- **SRP-Risiko:** Änderungen an Backoff/Retry-Strategien und an Observability (Logging/Timing) sind unterschiedliche Änderungsgründe. Ein separater Beobachtungs-/Metrik-Decorator um einen reinen Retry-Kern würde Verantwortlichkeiten trennen.

## Empfehlung
Schrittweises Aufteilen der betroffenen Klassen: je eine Kern-Implementierung mit klarem Verantwortungsbereich und optionale Decorators/Adapter für Konfiguration, Tracing oder Observability. Das reduziert Kopplung, erleichtert Tests und schafft klarere Änderungsgründe.
