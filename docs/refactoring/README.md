# Refactoring-Dokumentation

Dieses Verzeichnis enthält detaillierte Refactoring-Vorschläge basierend auf Code-Analysen.

## Übersicht

Die Refactoring-Vorschläge wurden aus der [SRP-Review vom 2024-12-02](../analysis/2024-12-02-srp-review.md) abgeleitet und adressieren Verletzungen des Single Responsibility Principle (SRP).

## Refactoring-Vorschläge

### 1. ModuleSettingsRegistrar - Fehler-Mapping extrahieren

**Datei**: [`01-module-settings-registrar-error-mapping.md`](./01-module-settings-registrar-error-mapping.md)

**Problem**: `ModuleSettingsRegistrar` mappt `DomainSettingsError` zu Notification-Format, was eine separate Verantwortlichkeit darstellt.

**Lösung**: `SettingRegistrationErrorMapper` als separate Komponente einführen.

**Komplexität**: ⭐ Niedrig
**Priorität**: Hoch (einfach umzusetzen, klare Extraktion)

### 2. ConsoleLoggerService - Decorator-Pattern für Config und Trace

**Datei**: [`02-console-logger-service-decorator-pattern.md`](./02-console-logger-service-decorator-pattern.md)

**Problem**: `ConsoleLoggerService` vereint Console-Logging, RuntimeConfig-Subscription und Trace-Formatierung.

**Lösung**: Decorator-Pattern mit `BaseConsoleLogger`, `RuntimeConfigLoggerDecorator` und `TraceContextLoggerDecorator`.

**Komplexität**: ⭐⭐⭐ Hoch (erfordert DI-Anpassungen)
**Priorität**: Mittel (höhere Komplexität, aber gute Architektur-Verbesserung)

### 3. RetryService - Observability-Decorator

**Datei**: [`03-retry-service-observability-decorator.md`](./03-retry-service-observability-decorator.md)

**Problem**: `RetryService` vermischt Retry-Algorithmus mit Timing-Messung und Logging.

**Lösung**: `BaseRetryService` für Kern-Logik, `RetryObservabilityDecorator` für Observability.

**Komplexität**: ⭐⭐ Mittel
**Priorität**: Hoch (gute Testbarkeit, klare Trennung)

## Umsetzungsreihenfolge

Empfohlene Reihenfolge für die Umsetzung:

1. **Finding 1** (ModuleSettingsRegistrar) - Niedrigste Komplexität, klare Extraktion
2. **Finding 3** (RetryService) - Mittlere Komplexität, aber gute Testbarkeit
3. **Finding 2** (ConsoleLoggerService) - Höchste Komplexität, erfordert DI-Anpassungen

## Breaking Changes

**Alle Refactorings sind Breaking-Change-frei** für externe APIs:
- Nur interne Strukturen werden geändert
- DI-Token bleiben kompatibel
- Externe APIs bleiben unverändert

## Verwandte Dokumentation

- [SRP-Review](../analysis/2024-12-02-srp-review.md) - Ursprüngliche Analyse
- [ARCHITECTURE.md](../ARCHITECTURE.md) - Architektur-Übersicht
- [QUICK-REFERENCE.md](../QUICK-REFERENCE.md) - Design Patterns im Projekt

## Status

| Refactoring | Status | Priorität | Komplexität |
|------------|--------|-----------|-------------|
| ModuleSettingsRegistrar | 📋 Geplant | Hoch | ⭐ Niedrig |
| ConsoleLoggerService | 📋 Geplant | Mittel | ⭐⭐⭐ Hoch |
| RetryService | 📋 Geplant | Hoch | ⭐⭐ Mittel |

**Legende**:
- 📋 Geplant
- 🔄 In Arbeit
- ✅ Abgeschlossen
- ❌ Abgebrochen

