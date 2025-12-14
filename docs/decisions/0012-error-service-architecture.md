# ADR-0012: ErrorService - Zentraler Error Controller

> **Status:** _Superseded by NotificationCenter (v0.18.0)_  
> Dieser ADR dokumentiert die ursprüngliche ErrorService-Architektur.  
> Seit v0.18.0 übernimmt das `NotificationCenter` alle Aufgaben des ErrorService.

**Status:** ✅ Implementiert (v0.17.0 - Unreleased)  
**Datum:** 2025-11-12  
**Kontext:** Einheitliche Fehlerbehandlung mit Multi-Channel-Output und Production-Sanitization  
**Entscheidung:** Zentrale ErrorService-Facade statt verteilter Logger-Aufrufe

---

## Problem

Fehlerbehandlung war inkonsistent über das Projekt verteilt:

1. **Direkte Logger-Aufrufe**: Services riefen direkt `logger.error()` auf
2. **Keine Sanitization**: Errors wurden ungefiltert an Console geloggt (auch in Production)
3. **Keine UI-Notifications**: Endnutzer sahen keine Fehlermeldungen (nur Entwickler in Console)
4. **Verteilte Verantwortlichkeit**: Jeder Service musste selbst entscheiden, wie Fehler ausgegeben werden

**Konkrete Probleme:**
```typescript
// Vor ErrorService: Inkonsistent & unsicher
this.logger.error("Failed to load data", error);  // Nur Console
this.foundryUI.notify("Error occurred", "error"); // Nur UI
// Keine Sanitization, keine Trennung Dev/Production
```

---

## Anforderungen

**Funktional:**
1. Zentraler Error-Controller für alle Business-Logic-Fehler
2. Multi-Channel-Routing: Console (Logger) und/oder UI (FoundryUI)
3. Automatische Sanitization für UI-Output in Production
4. Konfigurierbare Output-Channels pro Error
5. Development: Vollständige Details, Production: Generische Nachricht + Error-Code

**Nicht-Funktional:**
6. SOLID-konform (DI via Tokens)
7. 100% Test-Coverage
8. Keine Breaking Changes für existierende Services
9. Einfache API für Service-Entwickler

---

## Entscheidung

**Central Error Controller Pattern** - ErrorService als Facade für Error-Routing

### API-Design

```typescript
interface ErrorService {
  handleError(
    context: string,
    error: FoundryError | ContainerError,
    config?: ErrorOutputConfig
  ): Result<void, string>;

  handleUnknownError(
    context: string,
    error: unknown,
    config?: ErrorOutputConfig
  ): Result<void, string>;
}

interface ErrorOutputConfig {
  logToConsole?: boolean;    // Default: true
  showInUI?: boolean;        // Default: false
  uiNotificationType?: "info" | "warning" | "error";  // Default: "error"
}
```

### Verwendung

```typescript
class MyService {
  static dependencies = [errorServiceToken] as const;

  constructor(private errorService: ErrorService) {}

  async doSomething() {
    const result = await riskyOperation();
    
    if (!result.ok) {
      // Console only (default)
      this.errorService.handleError("Operation failed", result.error);
      
      // Both channels (critical errors)
      this.errorService.handleError("Critical error", result.error, {
        logToConsole: true,
        showInUI: true
      });
    }
  }
}
```

### Sanitization-Strategie

**Development Mode:**
- Console: Vollständige Error-Details
- UI: `${context}: ${error.message}` (hilfreich für Debugging)

**Production Mode:**
- Console: Vollständige Error-Details (für Entwickler/Support)
- UI: `${context}. Please try again or contact support. (Error: ${error.code})`

**Warum Error-Code in UI anzeigen?**
- Error-Code ist nicht sensitiv (definiert in `FoundryErrorCode` Enum)
- Hilft Support-Team bei Fehlerdiagnose ohne Architektur-Details zu leaken

---

## Alternativen

### Alternative 1: Error Sanitizer Strategy Pattern (ursprünglicher Vorschlag)

```typescript
class ErrorSanitizerService {
  constructor(private strategy: SanitizationStrategy, private env: EnvironmentConfig) {}
  
  sanitize(error): string {
    return this.strategy.sanitize(error, this.env.isDevelopment);
  }
}
```

**Abgelehnt wegen:**
- ❌ SOLID-Verletzung: Hidden Dependency (Strategy wird global gesetzt)
- ❌ Schlechte Testbarkeit (globaler State)
- ❌ Keine klare Trennung zwischen Output-Channels
- ❌ Sanitization ist nur EIN Teil des Problems (Routing fehlt)

### Alternative 2: Logger-Extension

```typescript
interface Logger {
  error(context: string, error: unknown, options?: { showInUI?: boolean }): void;
}
```

**Abgelehnt wegen:**
- ❌ SRP-Verletzung: Logger sollte nur loggen, nicht UI-Notifications senden
- ❌ Logger müsste FoundryUI kennen (Dependency Explosion)
- ❌ Keine Sanitization-Strategie implementierbar
- ❌ Schwer testbar (Logger ist bereits komplex genug)

### Alternative 3: Error-Event-System

```typescript
eventEmitter.emit({ type: "error", context, error, channels: ["console", "ui"] });
```

**Abgelehnt wegen:**
- ❌ Indirektion: Service weiß nicht, wo Fehler landen
- ❌ Event-Handler-Registration komplex
- ❌ Schwer nachvollziehbar bei Debugging
- ❌ Overhead für einfachen Use-Case

---

## Design-Vorteile

### 1. **Single Responsibility Principle (SRP)**
- ErrorService: Nur Error-Routing & Sanitization
- Logger: Nur Console-Logging
- FoundryUI: Nur UI-Notifications

### 2. **Separation of Concerns**
- Business-Logic (Services) kennt nur ErrorService
- ErrorService entscheidet über Output-Channels
- Sanitization-Logik zentralisiert

### 3. **Production Safety**
- Automatische Sanitization für UI-Output
- Keine manuellen if-Checks in jedem Service
- Schwer, Sanitization zu vergessen

### 4. **Testbarkeit**
- ErrorService einfach zu mocken
- Ein Mock statt zwei (Logger + FoundryUI)
- Klare Assertions: `handleError()` statt `logger.error()` + `ui.notify()`

### 5. **Erweiterbarkeit**
- Weitere Output-Channels einfach hinzufügbar (z.B. Remote-Logging)
- Sanitization-Strategie kann erweitert werden
- Config-Objekt kann erweitert werden (z.B. `severity`, `retryable`)

---

## Integration-Entscheidungen

### Was wurde umgestellt?

**✅ Business Logic Layer:**
- `JournalVisibilityService` - Error bei Journal-Verarbeitung
- `ModuleHookRegistrar` - Hook-Registration-Fehler
- `ModuleSettingsRegistrar` - Settings-Registration-Fehler
- `RenderJournalDirectoryHook` - Hook-Registration-Fehler

**❌ Infrastructure Layer (NICHT umgestellt):**
- `ObservabilityRegistry` - Low-Level-Diagnostics
- `PortSelectionObserver` - Low-Level-Port-Selection

**Begründung:**
- Infrastructure-Logs sind für Entwickler (immer Console-only)
- Keine UI-Notifications für Infrastructure-Fehler nötig
- Direkte Logger-Verwendung ist hier sinnvoll (weniger Indirektion)

### Bootstrap-Fehler

Alle Bootstrap-Fehler nutzen `showInUI: false`:

**Warum?**
- Foundry-UI ist während Bootstrap möglicherweise nicht verfügbar
- Bootstrap-Fehler sind schwerwiegend → Module wird nicht initialisiert
- Foundry zeigt eigene Error-Messages bei Module-Init-Failures
- Console-Output reicht für Debugging

**Beispiel:**
```typescript
errorService.handleError("Failed to register hook", error, {
  logToConsole: true,
  showInUI: false,  // Bootstrap error
});
```

---

## Metriken

### Code-Qualität
- **Tests:** +19 neue Tests (1104 → 1123)
- **Test-Coverage:** 100% (ErrorService voll getestet)
- **Type-Coverage:** 100% (10083/10083)
- **Linter-Errors:** 0

### Service-Integration
- **4 Services** umgestellt auf ErrorService
- **0 Breaking Changes** (additive API)
- **Alle Tests** bestehen (1123/1123)

---

## Konsequenzen

### Positiv ✅

1. **Einheitliche Fehlerbehandlung** - Ein Weg für alle Services
2. **Production-Sicherheit** - Automatische Sanitization verhindert Information Leakage
3. **Bessere UX** - Endnutzer können Fehler sehen (wenn konfiguriert)
4. **SOLID-konform** - Klare Verantwortlichkeiten, DI-managed
5. **Testbarkeit** - Ein Mock statt mehrerer
6. **Erweiterbar** - Neue Channels/Features einfach hinzufügbar

### Neutral ⚠️

1. **Zusätzliche Dependency** - Services benötigen jetzt `errorServiceToken`
2. **Leichte Indirektion** - Ein zusätzlicher Hop (Service → ErrorService → Logger/UI)

### Negativ (Trade-Offs) ❌

1. **Mehr Boilerplate** - Config-Objekt für komplexe Use-Cases
2. **Nicht für Infrastructure** - Low-Level-Code nutzt weiterhin direkten Logger

---

## Migrations-Pfad (Breaking Changes ab v1.0.0)

Da wir in v0.x.x sind: **Kein Migrations-Pfad nötig!**

**Ab v1.0.0 (wenn ErrorService zum Standard wird):**
1. Deprecation-Warnung für direkte `logger.error()` Aufrufe in Business-Logic
2. ESLint-Rule: `no-direct-logger-error-calls-in-business-logic`
3. Migration-Script: Automatisches Refactoring zu ErrorService
4. Deprecation-Zeitraum: 2 Major-Versionen (v1.x.x → v2.x.x → v3.x.x)

---

## Siehe auch

- [ADR-0011: Bootstrap `new` Instantiation Exceptions](./0011-bootstrap-new-instantiation-exceptions.md)
- Ursprüngliche [ErrorService Implementation](../../src/services/ErrorService.ts) _(entfernt in v0.18.0)_
- [QUICK-REFERENCE.md - NotificationCenter Usage](../QUICK-REFERENCE.md)

