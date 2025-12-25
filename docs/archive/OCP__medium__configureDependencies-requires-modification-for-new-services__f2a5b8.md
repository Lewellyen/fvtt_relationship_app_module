---
principle: OCP
severity: medium
confidence: high
component_kind: function
component_name: "configureDependencies"
file: "src/framework/config/dependencyconfig.ts"
location:
  start_line: 198
  end_line: 259
tags: ["open-closed", "configuration", "registration", "modification"]
---

# Problem

Die Funktion `configureDependencies` verletzt das Open/Closed Principle: Um neue Service-Module hinzuzufügen, muss die Funktion modifiziert werden. Neue Registrierungs-Schritte erfordern Code-Änderungen in der zentralen Orchestrierungs-Funktion.

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

**Problem:**
Um ein neues Service-Modul hinzuzufügen (z.B. `registerNewFeatureServices`), muss:
1. Die neue Funktion erstellt werden
2. Die Funktion in `configureDependencies` importiert werden
3. Ein neuer Aufruf in `configureDependencies` hinzugefügt werden
4. Die korrekte Reihenfolge sichergestellt werden

**Aktuell: 14+ explizite Aufrufe in statischer Reihenfolge**

## Impact

- **Erweiterbarkeit**: Neue Services erfordern Code-Änderungen in zentraler Funktion
- **Wartbarkeit**: Reihenfolge ist im Code hartcodiert, nicht konfigurierbar
- **Testbarkeit**: Schwer zu testen mit verschiedenen Konfigurationen
- **Flexibilität**: Keine Möglichkeit, Services optional zu registrieren ohne Code-Änderung

## Recommendation

**Option 1: Registry-Pattern (Empfohlen)**
Verwende ein Registry-Pattern für Registrierungs-Schritte:

```typescript
interface DependencyRegistrationStep {
  name: string;
  priority: number;
  execute: (container: ServiceContainer) => Result<void, string>;
}

class DependencyRegistrationRegistry {
  private steps: DependencyRegistrationStep[] = [];

  register(step: DependencyRegistrationStep): void {
    this.steps.push(step);
    this.steps.sort((a, b) => a.priority - b.priority);
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

// Neue Services können über Registry hinzugefügt werden:
const registry = new DependencyRegistrationRegistry();
registry.register({ name: "StaticValues", priority: 10, execute: registerStaticValues });
registry.register({ name: "CoreServices", priority: 20, execute: registerCoreServices });
// ... weitere Steps

export function configureDependencies(container: ServiceContainer): Result<void, string> {
  return registry.configure(container);
}
```

**Option 2: Plugin-System**
Erlaube Plugins, die ihre eigenen Registrierungs-Schritte registrieren können.

**Option 3: Keine Änderung (Akzeptabel für Bootstrap-Code)**
Die aktuelle Implementierung ist für Bootstrap/Configuration-Code akzeptabel, da:
- Die Registrierungsreihenfolge ist wichtig und sollte explizit sein
- Die Komplexität durch Registry könnte die Lesbarkeit verschlechtern
- Neue Services werden nicht häufig hinzugefügt
- Die Dokumentation (REGISTRATION ORDER Kommentar) macht die Reihenfolge klar

## Example Fix

Siehe Option 1 in Recommendation.

## Notes

- Die explizite Reihenfolge hat Vorteile: Klarheit, Dokumentation im Code
- Registry-Pattern würde Erweiterbarkeit verbessern, könnte aber Lesbarkeit verschlechtern
- Dies ist eine Design-Entscheidung: Explizitheit vs. Flexibilität
- Für einen Framework-Layer ist explizite Konfiguration oft vorzuziehen

