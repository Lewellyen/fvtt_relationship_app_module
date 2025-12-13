---
principle: SRP
severity: medium
confidence: high
component_kind: function
component_name: "configureDependencies"
file: "src/framework/config/dependencyconfig.ts"
location:
  start_line: 198
  end_line: 259
tags: ["orchestration", "configuration", "bootstrap", "responsibility"]
---

# Problem

Die Funktion `configureDependencies` orchestriert 14+ verschiedene Registrierungsschritte in einer einzigen Funktion. Während sie an modulare Helper-Funktionen delegiert, bleibt sie selbst für die Orchestrierung, Fehlerbehandlung und Validierung verantwortlich.

## Evidence

```198:259:src/framework/config/dependencyconfig.ts
export function configureDependencies(container: ServiceContainer): Result<void, string> {
  const staticValuesResult = registerStaticValues(container);
  if (isErr(staticValuesResult)) return staticValuesResult;

  // Register all service modules in order
  const coreResult = registerCoreServices(container);
  if (isErr(coreResult)) return coreResult;

  const observabilityResult = registerObservability(container);
  if (isErr(observabilityResult)) return observabilityResult;

  const utilityResult = registerUtilityServices(container);
  if (isErr(utilityResult)) return utilityResult;

  const cacheServiceResult = registerCacheServices(container);
  if (isErr(cacheServiceResult)) return cacheServiceResult;

  const portInfraResult = registerPortInfrastructure(container);
  if (isErr(portInfraResult)) return portInfraResult;

  const subcontainerValuesResult = registerSubcontainerValues(container);
  if (isErr(subcontainerValuesResult)) return subcontainerValuesResult;

  const foundryServicesResult = registerFoundryServices(container);
  if (isErr(foundryServicesResult)) return foundryServicesResult;

  const settingsPortsResult = registerSettingsPorts(container);
  if (isErr(settingsPortsResult)) return settingsPortsResult;

  const entityPortsResult = registerEntityPorts(container);
  if (isErr(entityPortsResult)) return entityPortsResult;

  const journalVisibilityConfigResult = registerJournalVisibilityConfig(container);
  if (isErr(journalVisibilityConfigResult)) return journalVisibilityConfigResult;

  const i18nServicesResult = registerI18nServices(container);
  if (isErr(i18nServicesResult)) return i18nServicesResult;

  const notificationsResult = registerNotifications(container);
  if (isErr(notificationsResult)) return notificationsResult;

  const eventPortsResult = registerEventPorts(container);
  if (isErr(eventPortsResult)) return eventPortsResult;

  const registrarsResult = registerRegistrars(container);
  if (isErr(registrarsResult)) return registrarsResult;

  const loopServiceResult = registerLoopPreventionServices(container);
  if (isErr(loopServiceResult)) return loopServiceResult;

  // Validate container configuration
  const validationResult = validateContainer(container);
  if (isErr(validationResult)) return validationResult;

  const loopPreventionInitResult = initializeLoopPreventionValues(container);
  if (isErr(loopPreventionInitResult)) return loopPreventionInitResult;

  const cacheConfigSyncInitResult = initializeCacheConfigSync(container);
  if (isErr(cacheConfigSyncInitResult)) return cacheConfigSyncInitResult;

  return ok(undefined);
}
```

**Verantwortlichkeiten der Funktion:**
1. Orchestrierung von 14+ Registrierungsschritten
2. Fehlerbehandlung für jeden Schritt (if/return-Pattern)
3. Reihenfolgen-Management (statische Reihenfolge im Code)
4. Validierung des Containers
5. Initialisierung von Post-Registration-Services

Die Funktion ist 61 Zeilen lang und führt viele verschiedene Schritte aus. Während die Delegation an modulare Funktionen gut ist, bleibt die Orchestrierung selbst komplex.

## Impact

- **Wartbarkeit**: Änderungen an der Registrierungsreihenfolge erfordern Code-Änderungen
- **Testbarkeit**: Schwer zu testen, da viele Abhängigkeiten orchestriert werden müssen
- **Verständlichkeit**: 14+ Schritte in einer Funktion machen es schwer, den Überblick zu behalten
- **Fehlerbehandlung**: Wiederholende if/return-Patterns erhöhen die Komplexität

## Recommendation

**Option 1: DependencyConfigurationOrchestrator (Empfohlen)**
Erstelle eine Klasse, die die Orchestrierung übernimmt und das Registrierungsreihenfolge-Management kapselt:

```typescript
export class DependencyConfigurationOrchestrator {
  private readonly steps: Array<{
    name: string;
    execute: (container: ServiceContainer) => Result<void, string>;
  }> = [];

  addStep(name: string, execute: (container: ServiceContainer) => Result<void, string>): void {
    this.steps.push({ name, execute });
  }

  configure(container: ServiceContainer): Result<void, string> {
    for (const step of this.steps) {
      const result = step.execute(container);
      if (isErr(result)) {
        return err(`Failed at step '${step.name}': ${result.error}`);
      }
    }
    return ok(undefined);
  }
}

// In dependencyconfig.ts:
export function configureDependencies(container: ServiceContainer): Result<void, string> {
  const orchestrator = new DependencyConfigurationOrchestrator();

  orchestrator.addStep("StaticValues", registerStaticValues);
  orchestrator.addStep("CoreServices", registerCoreServices);
  // ... weitere Steps

  return orchestrator.configure(container);
}
```

**Option 2: Keine Änderung (Akzeptabel für Framework-Layer)**
Die aktuelle Implementierung ist für einen Framework-Layer akzeptabel, da:
- Sie als zentrale Orchestrierungsfunktion fungiert
- Die Delegation an modulare Funktionen bereits gut ist
- Die Komplexität durch die Dokumentation (REGISTRATION ORDER Kommentar) abgemildert wird

## Example Fix

Siehe Option 1 in Recommendation.

## Notes

- Die Funktion delegiert bereits gut an modulare `registerXxx`-Funktionen
- Die Komplexität kommt hauptsächlich von der Orchestrierung, nicht von der Implementierung
- Ein Refactoring würde die Testbarkeit verbessern, ist aber nicht kritisch
- Die Reihenfolge ist dokumentiert und wichtig für die Dependency-Injection

