# Refactoring-Plan: ServiceContainer SRP-Verletzung

**Erstellungsdatum:** 2025-12-10
**Status:** Geplant
**Priorität:** Hoch
**Betroffene Datei:** `src/infrastructure/di/container.ts`

---

## Problem-Beschreibung

Die `ServiceContainer`-Klasse verletzt das Single Responsibility Principle (SRP) schwerwiegend. Sie ist ein God Object mit mindestens 8 verschiedenen Verantwortlichkeiten:

1. **Service-Registrierung** (`registerClass`, `registerFactory`, `registerValue`, `registerAlias`)
2. **Service-Validierung** (`validate`, `validationState` Management)
3. **Service-Auflösung** (`resolve`, `resolveWithError`)
4. **Scope-Management** (`createScope`, Child Container Creation)
5. **Disposal-Management** (`dispose`, Disposal State)
6. **Metrics-Injection** (`injectMetricsCollector`)
7. **API-Sicherheit** (ApiSafeToken Validation)
8. **Domain/Infrastructure Token-Mapping**

**Aktuelle Architektur:**
- ServiceContainer ist eine Facade, die bereits einige Komponenten delegiert (ServiceRegistry, ContainerValidator, ServiceResolver, ScopeManager)
- Aber die Facade selbst enthält noch zu viel Logik und Koordinations-Code
- Validation State Management ist direkt in ServiceContainer
- Metrics-Injection ist direkt in ServiceContainer
- API-Sicherheits-Checks sind direkt in ServiceContainer

---

## Ziel-Architektur

### Neue Klassen-Struktur

```
ServiceContainer (Facade - nur Koordination)
├── ServiceRegistrationManager
│   └── Delegiert zu ServiceRegistry (bereits vorhanden)
├── ContainerValidationManager
│   └── Delegiert zu ContainerValidator (bereits vorhanden)
│   └── Verwaltet Validation State
├── ServiceResolutionManager
│   └── Delegiert zu ServiceResolver (bereits vorhanden)
├── ScopeManagementFacade
│   └── Delegiert zu ScopeManager (bereits vorhanden)
│   └── Verwaltet Child Container Creation
├── MetricsInjectionManager
│   └── Verwaltet Metrics-Injection in Resolver
└── ApiSecurityManager
    └── Verwaltet ApiSafeToken Validation
```

### Verantwortlichkeiten

| Klasse | Verantwortlichkeit | Delegiert an |
|--------|-------------------|--------------|
| `ServiceContainer` | Nur Koordination der Manager | Alle Manager |
| `ServiceRegistrationManager` | Service-Registrierung | `ServiceRegistry` |
| `ContainerValidationManager` | Validierung + State Management | `ContainerValidator` |
| `ServiceResolutionManager` | Service-Auflösung | `ServiceResolver` |
| `ScopeManagementFacade` | Scope-Management + Child Creation | `ScopeManager` |
| `MetricsInjectionManager` | Metrics-Injection | - |
| `ApiSecurityManager` | API-Sicherheits-Checks | - |

---

## Schritt-für-Schritt Refactoring-Plan

### Phase 1: Vorbereitung (Tests & Interfaces)

1. **Tests für aktuelle Funktionalität schreiben**
   - Alle Public-Methoden von ServiceContainer testen
   - Edge Cases abdecken
   - Integration Tests für Container-Lifecycle

2. **Interfaces definieren**
   ```typescript
   interface IServiceRegistrationManager {
     registerClass<T>(...): Result<void, ContainerError>;
     registerFactory<T>(...): Result<void, ContainerError>;
     registerValue<T>(...): Result<void, ContainerError>;
     registerAlias<T>(...): Result<void, ContainerError>;
   }

   interface IContainerValidationManager {
     validate(): Result<void, ContainerError[]>;
     getValidationState(): ContainerValidationState;
   }

   interface IServiceResolutionManager {
     resolve<T>(...): Result<T, ContainerError>;
     resolveWithError<T>(...): T;
   }

   interface IScopeManagementFacade {
     createScope(name: string): Result<ServiceContainer, ContainerError>;
   }

   interface IMetricsInjectionManager {
     injectMetricsCollector(collector: MetricsCollector): Result<void, ContainerError>;
   }

   interface IApiSecurityManager {
     validateApiSafeToken<T>(token: InjectionToken<T>): Result<void, ContainerError>;
   }
   ```

### Phase 2: Manager-Klassen erstellen

3. **ServiceRegistrationManager erstellen**
   - Datei: `src/infrastructure/di/registration/ServiceRegistrationManager.ts`
   - Delegiert zu `ServiceRegistry`
   - Enthält Disposal- und Validation-State-Checks
   - Tests schreiben

4. **ContainerValidationManager erstellen**
   - Datei: `src/infrastructure/di/validation/ContainerValidationManager.ts`
   - Verwaltet `validationState` und `validationPromise`
   - Delegiert zu `ContainerValidator`
   - Tests schreiben

5. **ServiceResolutionManager erstellen**
   - Datei: `src/infrastructure/di/resolution/ServiceResolutionManager.ts`
   - Delegiert zu `ServiceResolver`
   - Enthält Disposal-Checks
   - Tests schreiben

6. **ScopeManagementFacade erstellen**
   - Datei: `src/infrastructure/di/scope/ScopeManagementFacade.ts`
   - Verwaltet Child Container Creation
   - Delegiert zu `ScopeManager`
   - Tests schreiben

7. **MetricsInjectionManager erstellen**
   - Datei: `src/infrastructure/di/metrics/MetricsInjectionManager.ts`
   - Verwaltet Metrics-Injection in ServiceResolver
   - Tests schreiben

8. **ApiSecurityManager erstellen**
   - Datei: `src/infrastructure/di/security/ApiSecurityManager.ts`
   - Verwaltet ApiSafeToken Validation
   - Tests schreiben

### Phase 3: ServiceContainer refactoren

9. **ServiceContainer umbauen**
   - Alle Manager als Dependencies injizieren
   - ServiceContainer wird zur reinen Facade
   - Alle Methoden delegieren zu entsprechenden Managern
   - Private Felder für Manager hinzufügen

10. **Constructor anpassen**
    - Manager als Parameter übergeben
    - Factory-Methoden anpassen (`createRoot`)

### Phase 4: Integration & Tests

11. **Integration Tests**
    - Alle bestehenden Tests müssen weiterhin funktionieren
    - Keine Breaking Changes für externe API

12. **Performance Tests**
    - Sicherstellen, dass keine Performance-Regression auftritt

---

## Migration-Strategie

### Backward Compatibility

- **Public API bleibt unverändert**: Alle Public-Methoden von `ServiceContainer` bleiben erhalten
- **Interne Implementierung ändert sich**: Nur interne Struktur wird refactored
- **Keine Breaking Changes**: Externe Consumer merken keine Änderung

### Rollout-Plan

1. **Feature Branch erstellen**: `refactor/service-container-srp`
2. **Manager-Klassen implementieren**: Parallel zu bestehendem Code
3. **ServiceContainer schrittweise umbauen**: Manager nach Manager integrieren
4. **Tests durchlaufen lassen**: Alle Tests müssen grün sein
5. **Code Review**: Review der Refactoring-Änderungen
6. **Merge**: In Main-Branch mergen

---

## Tests

### Unit Tests

- **ServiceRegistrationManager**
  - `registerClass` mit verschiedenen Lifecycles
  - `registerFactory` mit Validierung
  - `registerValue` und `registerAlias`
  - Disposal- und Validation-State-Checks

- **ContainerValidationManager**
  - `validate` mit verschiedenen States
  - Validation Promise Handling
  - Error-Aggregation

- **ServiceResolutionManager**
  - `resolve` mit verschiedenen Tokens
  - `resolveWithError` mit Fehlerbehandlung
  - Disposal-Checks

- **ScopeManagementFacade**
  - `createScope` mit verschiedenen Namen
  - Child Container Disposal
  - Scope Chain Behavior

- **MetricsInjectionManager**
  - `injectMetricsCollector` mit verschiedenen Collectors
  - Null-Checks
  - Resolver-Update

- **ApiSecurityManager**
  - ApiSafeToken Validation
  - Domain/Infrastructure Token-Mapping

### Integration Tests

- **ServiceContainer als Facade**
  - Vollständiger Container-Lifecycle
  - Registration → Validation → Resolution
  - Scope Creation und Disposal
  - Metrics-Injection

### Regression Tests

- Alle bestehenden Tests müssen weiterhin funktionieren
- Keine Performance-Regression

---

## Breaking Changes

**Keine Breaking Changes erwartet**

- Public API von `ServiceContainer` bleibt unverändert
- Interne Implementierung ändert sich nur
- Externe Consumer merken keine Änderung

---

## Risiken

### Technische Risiken

1. **Performance-Regression**
   - **Risiko**: Zusätzliche Delegation-Layer könnten Performance beeinträchtigen
   - **Mitigation**: Performance Tests durchführen, ggf. optimieren

2. **Fehlerhafte Delegation**
   - **Risiko**: Manager delegieren falsch oder unvollständig
   - **Mitigation**: Umfassende Tests, Code Review

3. **State-Management-Fehler**
   - **Risiko**: Validation State wird falsch verwaltet
   - **Mitigation**: State-Management isoliert testen

### Projekt-Risiken

1. **Zeitaufwand**
   - **Risiko**: Refactoring dauert länger als erwartet
   - **Mitigation**: Schrittweise Vorgehen, Feature Branch

2. **Code-Review-Komplexität**
   - **Risiko**: Große PR mit vielen Änderungen
   - **Mitigation**: Kleine, inkrementelle Commits

---

## Erfolgs-Kriterien

- ✅ Alle Manager-Klassen implementiert
- ✅ ServiceContainer ist reine Facade (nur Koordination)
- ✅ Alle Tests bestehen (Unit + Integration)
- ✅ Keine Performance-Regression
- ✅ Keine Breaking Changes
- ✅ Code Review bestanden
- ✅ Dokumentation aktualisiert

---

## Offene Fragen

1. Sollen Manager als Singleton oder Transient registriert werden?
2. Wie wird Metrics-Injection in Child Containers gehandhabt?
3. Soll ApiSecurityManager auch für Domain-Tokens zuständig sein?

---

## Referenzen

- [SOLID-Analyse: SRP](../Analyse/solid-01-single-responsibility-principle.md)
- [ServiceContainer Source Code](../../src/infrastructure/di/container.ts)
- [ServiceRegistry](../../src/infrastructure/di/registry/ServiceRegistry.ts)
- [ContainerValidator](../../src/infrastructure/di/validation/ContainerValidator.ts)
- [ServiceResolver](../../src/infrastructure/di/resolution/ServiceResolver.ts)
- [ScopeManager](../../src/infrastructure/di/scope/ScopeManager.ts)

---

**Letzte Aktualisierung:** 2025-12-10

