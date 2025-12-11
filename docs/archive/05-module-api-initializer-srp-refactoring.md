# Refactoring-Plan: ModuleApiInitializer SRP-Verletzung

**Erstellungsdatum:** 2025-12-10
**Status:** Geplant
**Priorität:** Hoch
**Betroffene Datei:** `src/framework/core/api/module-api-initializer.ts`

---

## Problem-Beschreibung

Die `ModuleApiInitializer`-Klasse verletzt das Single Responsibility Principle (SRP) mit 5 verschiedenen Verantwortlichkeiten:

1. **API-Erstellung** (`createApi`, `createApiTokens`)
2. **Service-Wrapping** (`wrapSensitiveService` für verschiedene Service-Types)
3. **Deprecation-Handling** (`handleDeprecationWarning`)
4. **Service-Resolution** (`createResolveFunction`, `createResolveWithErrorFunction`)
5. **Health/Metrics-Integration** (`getMetrics`, `getHealth`)

**Aktuelle Architektur:**
- ModuleApiInitializer erstellt komplette API-Objekte
- Wrappt Services direkt mit verschiedenen Wrappern
- Handhabt Deprecation-Warnings direkt
- Erstellt Resolution-Funktionen direkt
- Integriert Health und Metrics direkt

**Problem:** API-Erstellung, Wrapping, Deprecation und Resolution sind unterschiedliche Verantwortlichkeiten, die getrennt werden sollten.

---

## Ziel-Architektur

### Neue Klassen-Struktur

```
ModuleApiInitializer (Facade - nur Koordination)
├── ModuleApiBuilder (nur API-Erstellung)
│   ├── createApi()
│   └── createApiTokens()
├── ServiceWrapperFactory (nur Service-Wrapping)
│   ├── wrapSensitiveService()
│   └── createWrapper()
├── DeprecationHandler (nur Deprecation-Warnings)
│   ├── handleDeprecationWarning()
│   └── checkDeprecation()
├── ApiServiceResolver (nur Resolution-Logik)
│   ├── createResolveFunction()
│   └── createResolveWithErrorFunction()
└── ApiHealthMetricsProvider (nur Health/Metrics)
    ├── getMetrics()
    └── getHealth()
```

### Verantwortlichkeiten

| Klasse | Verantwortlichkeit | Methoden |
|--------|-------------------|----------|
| `ModuleApiInitializer` | Nur Koordination | `expose()` - delegiert zu allen Komponenten |
| `ModuleApiBuilder` | Nur API-Erstellung | `createApi()`, `createApiTokens()` |
| `ServiceWrapperFactory` | Nur Service-Wrapping | `wrapSensitiveService()`, `createWrapper()` |
| `DeprecationHandler` | Nur Deprecation-Warnings | `handleDeprecationWarning()`, `checkDeprecation()` |
| `ApiServiceResolver` | Nur Resolution-Logik | `createResolveFunction()`, `createResolveWithErrorFunction()` |
| `ApiHealthMetricsProvider` | Nur Health/Metrics | `getMetrics()`, `getHealth()` |

---

## Schritt-für-Schritt Refactoring-Plan

### Phase 1: Vorbereitung (Tests & Interfaces)

1. **Tests für aktuelle Funktionalität schreiben**
   - Alle Public-Methoden von ModuleApiInitializer testen
   - API-Erstellung testen
   - Service-Wrapping testen
   - Deprecation-Handling testen
   - Resolution-Logik testen

2. **Interfaces definieren**
   ```typescript
   interface IModuleApiBuilder {
     createApi(container: PlatformContainerPort, tokens: ModuleApiTokens): ModuleApi;
     createApiTokens(): ModuleApiTokens;
   }

   interface IServiceWrapperFactory {
     wrapSensitiveService<TServiceType>(
       token: ApiSafeToken<TServiceType>,
       container: PlatformContainerPort
     ): TServiceType;
     createWrapper<TServiceType>(
       token: ApiSafeToken<TServiceType>,
       service: TServiceType
     ): TServiceType;
   }

   interface IDeprecationHandler {
     handleDeprecationWarning<TServiceType>(token: ApiSafeToken<TServiceType>): void;
     checkDeprecation<TServiceType>(token: ApiSafeToken<TServiceType>): DeprecationInfo | null;
   }

   interface IApiServiceResolver {
     createResolveFunction(container: PlatformContainerPort): (token: ApiSafeToken<unknown>) => unknown;
     createResolveWithErrorFunction(container: PlatformContainerPort): <T>(token: ApiSafeToken<T>) => T;
   }

   interface IApiHealthMetricsProvider {
     getMetrics(container: PlatformContainerPort): MetricsSnapshot | null;
     getHealth(container: PlatformContainerPort): HealthStatus;
   }
   ```

### Phase 2: Neue Klassen erstellen

3. **ModuleApiBuilder erstellen**
   - Datei: `src/framework/core/api/builder/module-api-builder.ts`
   - Implementiert `IModuleApiBuilder`
   - Enthält `createApi()` und `createApiTokens()` Logik
   - Tests schreiben

4. **ServiceWrapperFactory erstellen**
   - Datei: `src/framework/core/api/wrappers/service-wrapper-factory.ts`
   - Implementiert `IServiceWrapperFactory`
   - Enthält alle Wrapper-Logik (FoundrySettings, I18n, NotificationCenter)
   - Tests schreiben

5. **DeprecationHandler erstellen**
   - Datei: `src/framework/core/api/deprecation/deprecation-handler.ts`
   - Implementiert `IDeprecationHandler`
   - Enthält `handleDeprecationWarning()` Logik
   - Tests schreiben

6. **ApiServiceResolver erstellen**
   - Datei: `src/framework/core/api/resolution/api-service-resolver.ts`
   - Implementiert `IApiServiceResolver`
   - Enthält `createResolveFunction()` und `createResolveWithErrorFunction()` Logik
   - Tests schreiben

7. **ApiHealthMetricsProvider erstellen**
   - Datei: `src/framework/core/api/health/api-health-metrics-provider.ts`
   - Implementiert `IApiHealthMetricsProvider`
   - Enthält `getMetrics()` und `getHealth()` Logik
   - Tests schreiben

### Phase 3: ModuleApiInitializer refactoren

8. **ModuleApiInitializer umbauen**
   - Alle Komponenten als Dependencies injizieren
   - ModuleApiInitializer wird zur reinen Facade
   - `expose()` delegiert zu allen Komponenten
   - Private Methoden entfernen/verschieben:
     - `handleDeprecationWarning()` → delegiert zu DeprecationHandler
     - `createResolveFunction()` → delegiert zu ApiServiceResolver
     - `createResolveWithErrorFunction()` → delegiert zu ApiServiceResolver
     - `createApiObject()` → delegiert zu ModuleApiBuilder
     - `getMetrics()` → delegiert zu ApiHealthMetricsProvider
     - `getHealth()` → delegiert zu ApiHealthMetricsProvider

9. **Constructor anpassen**
   - Alle Komponenten als Parameter übergeben
   - Factory-Methoden anpassen

### Phase 4: Integration & Tests

10. **Integration Tests**
    - ModuleApiInitializer mit allen Komponenten zusammen testen
    - Vollständiger Flow: Expose → Build → Wrap → Resolve → Health
    - Alle Komponenten koordinieren korrekt

11. **Performance Tests**
    - Sicherstellen, dass keine Performance-Regression auftritt

---

## Migration-Strategie

### Backward Compatibility

- **Public API bleibt unverändert**: `expose()` bleibt erhalten
- **Interne Implementierung ändert sich**: Nur interne Struktur wird refactored
- **Keine Breaking Changes**: Externe Consumer merken keine Änderung

### Rollout-Plan

1. **Feature Branch erstellen**: `refactor/module-api-initializer-srp`
2. **Komponenten-Klassen implementieren**: Parallel zu bestehendem Code
3. **ModuleApiInitializer schrittweise umbauen**: Builder → Wrapper → Deprecation → Resolver → Health
4. **Tests durchlaufen lassen**: Alle Tests müssen grün sein
5. **Code Review**: Review der Refactoring-Änderungen
6. **Merge**: In Main-Branch mergen

---

## Tests

### Unit Tests

- **ModuleApiBuilder**
  - `createApi()` erstellt korrektes API-Objekt
  - `createApiTokens()` erstellt korrekte Tokens

- **ServiceWrapperFactory**
  - `wrapSensitiveService()` wrappt verschiedene Service-Types
  - `createWrapper()` erstellt korrekte Wrapper

- **DeprecationHandler**
  - `handleDeprecationWarning()` zeigt Warnings korrekt
  - `checkDeprecation()` prüft Deprecation korrekt

- **ApiServiceResolver**
  - `createResolveFunction()` erstellt korrekte Resolve-Funktion
  - `createResolveWithErrorFunction()` erstellt korrekte ResolveWithError-Funktion

- **ApiHealthMetricsProvider**
  - `getMetrics()` gibt korrekte Metrics zurück
  - `getHealth()` gibt korrekten Health-Status zurück

- **ModuleApiInitializer (refactored)**
  - `expose()` delegiert korrekt zu allen Komponenten
  - Koordination funktioniert

### Integration Tests

- **ModuleApiInitializer als Facade**
  - Vollständiger Flow: Expose → Build → Wrap → Resolve → Health
  - Alle Komponenten koordinieren korrekt
  - API wird korrekt exponiert

### Regression Tests

- Alle bestehenden Tests müssen weiterhin funktionieren
- Keine Performance-Regression

---

## Breaking Changes

**Keine Breaking Changes erwartet**

- Public API von `ModuleApiInitializer` bleibt unverändert
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

3. **Wrapper-Kompatibilität**
   - **Risiko**: Wrapper funktionieren nicht korrekt mit neuen Komponenten
   - **Mitigation**: Umfassende Tests für alle Wrapper-Types

### Projekt-Risiken

1. **Zeitaufwand**
   - **Risiko**: Refactoring dauert länger als erwartet
   - **Mitigation**: Schrittweise Vorgehen, Feature Branch

2. **Code-Review-Komplexität**
   - **Risiko**: Große PR mit vielen Änderungen
   - **Mitigation**: Kleine, inkrementelle Commits

---

## Erfolgs-Kriterien

- ✅ ModuleApiInitializer ist reine Facade (nur Koordination)
- ✅ ModuleApiBuilder verwaltet nur API-Erstellung
- ✅ ServiceWrapperFactory verwaltet nur Service-Wrapping
- ✅ DeprecationHandler verwaltet nur Deprecation-Warnings
- ✅ ApiServiceResolver verwaltet nur Resolution-Logik
- ✅ ApiHealthMetricsProvider verwaltet nur Health/Metrics
- ✅ Alle Tests bestehen (Unit + Integration)
- ✅ Keine Performance-Regression
- ✅ Keine Breaking Changes
- ✅ Code Review bestanden
- ✅ Dokumentation aktualisiert

---

## Offene Fragen

1. Sollen Komponenten als Singleton oder pro Initializer-Instanz sein?
2. Wie wird Wrapper-Caching gehandhabt?
3. Soll DeprecationHandler auch für andere APIs verwendet werden?

---

## Referenzen

- [SOLID-Analyse: SRP](../Analyse/solid-01-single-responsibility-principle.md)
- [ModuleApiInitializer Source Code](../../src/framework/core/api/module-api-initializer.ts)
- [ModuleApi Interface](../../src/framework/core/api/module-api.ts)
- [Public API Wrappers](../../src/framework/core/api/public-api-wrappers.ts)

---

**Letzte Aktualisierung:** 2025-12-10

