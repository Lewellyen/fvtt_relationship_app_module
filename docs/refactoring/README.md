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

### 4. Notification Queue UI Channel

**Datei**: [`04-notification-queue-ui-channel.md`](./04-notification-queue-ui-channel.md)

**Problem**: UI-Notifications gehen verloren, wenn sie vor der Verfügbarkeit von Foundry UI gesendet werden.

**Lösung**: `QueuedUIChannel` als Decorator, der Notifications sammelt und ausgibt, sobald UI verfügbar ist.

**Komplexität**: ⭐⭐ Mittel
**Priorität**: Mittel

### 5. Notification Channel Port Hierarchy ⭐ **NEU**

**Datei**: [`05-notification-channel-port-hierarchy.md`](./05-notification-channel-port-hierarchy.md)

**Problem**: `NotificationCenter` nutzt Infrastructure-Interfaces direkt statt Domain-Ports. Keine Port-Hierarchie wie beim Event-System.

**Lösung**: Port-Hierarchie analog zum Event-System: `PlatformChannelPort` → `PlatformUINotificationChannelPort` / `PlatformConsoleChannelPort`. `NotificationCenter` nutzt nur Domain-Ports.

**Komplexität**: ⭐⭐⭐ Hoch (Architektur-Refactoring)
**Priorität**: Hoch (Architektur-Konsistenz, OCP-Konformität)

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
| Notification Queue UI Channel | 📋 Geplant | Mittel | ⭐⭐ Mittel |
| Notification Channel Port Hierarchy | 📋 Geplant | Hoch | ⭐⭐⭐ Hoch |

**Legende**:
- 📋 Geplant
- 🔄 In Arbeit
- ✅ Abgeschlossen
- ❌ Abgebrochen

