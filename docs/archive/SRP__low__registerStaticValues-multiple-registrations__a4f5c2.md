---
principle: SRP
severity: low
confidence: high
component_kind: function
component_name: "registerStaticValues"
file: "src/framework/config/dependencyconfig.ts"
location:
  start_line: 45
  end_line: 87
tags: ["registration", "static-values", "bootstrap"]
---

# Problem

Die Funktion `registerStaticValues` registriert 5 verschiedene statische Werte in einer einzigen Funktion. Jede Registrierung hat eine eigene Verantwortlichkeit (EnvironmentConfig, RuntimeConfig, ServiceContainer, PlatformContainerPort-Alias, ModuleId).

## Evidence

```45:87:src/framework/config/dependencyconfig.ts
function registerStaticValues(container: ServiceContainer): Result<void, string> {
  const envResult = container.registerValue(environmentConfigToken, ENV);
  if (isErr(envResult)) {
    return err(`Failed to register EnvironmentConfig: ${envResult.error.message}`);
  }

  const runtimeConfigAdapter = new RuntimeConfigAdapter(ENV);
  const runtimeConfigResult = container.registerValue(runtimeConfigToken, runtimeConfigAdapter);
  if (isErr(runtimeConfigResult)) {
    return err(`Failed to register RuntimeConfigAdapter: ${runtimeConfigResult.error.message}`);
  }

  const containerResult = container.registerValue(serviceContainerToken, container);
  if (isErr(containerResult)) {
    return err(`Failed to register ServiceContainer: ${containerResult.error.message}`);
  }

  // Register PlatformContainerPort as alias to ServiceContainer
  // ServiceContainer implements PlatformContainerPort, so this provides the abstraction
  // for Framework layer without duplicating the instance
  // Note: Type assertion is required because PlatformContainerPort and Container are different types,
  // even though ServiceContainer implements both. This is a known limitation of the type system
  // when dealing with interface aliases. The runtime behavior is correct.
  // Type assertion needed because PlatformContainerPort and Container are different types,
  // even though ServiceContainer implements both. The cast function is in runtime-safe-cast.ts
  // which is excluded from type coverage, so we use a direct assertion here.
  const aliasResult = container.registerAlias(
    platformContainerPortToken,
    castContainerTokenToPlatformContainerPortToken(serviceContainerToken)
  );
  if (isErr(aliasResult)) {
    return err(`Failed to register PlatformContainerPort alias: ${aliasResult.error.message}`);
  }

  // Register module ID as static value
  // This allows Infrastructure services to access module ID without importing from Application layer
  const moduleIdResult = container.registerValue(moduleIdToken, MODULE_METADATA.ID);
  if (isErr(moduleIdResult)) {
    return err(`Failed to register ModuleId: ${moduleIdResult.error.message}`);
  }

  return ok(undefined);
}
```

**5 verschiedene Registrierungen:**
1. EnvironmentConfig (ENV)
2. RuntimeConfigAdapter (mit ENV erstellt)
3. ServiceContainer (self-reference)
4. PlatformContainerPort (Alias)
5. ModuleId (aus MODULE_METADATA)

Jede Registrierung hat:
- Eigene Fehlerbehandlung
- Eigene Fehlermeldung
- Eigene Logik (z.B. RuntimeConfigAdapter-Erstellung)

## Impact

- **Testbarkeit**: Schwer zu testen einzelne Registrierungen isoliert
- **Wartbarkeit**: Änderungen an einer Registrierung erfordern Code-Änderungen an der gesamten Funktion
- **Wiederverwendbarkeit**: Kann nicht einzelne Registrierungen wiederverwenden

## Recommendation

**Option 1: Separate Functions (Empfohlen für größere Klarheit)**
Erstelle separate Funktionen für jede Registrierung:

```typescript
function registerEnvironmentConfig(container: ServiceContainer): Result<void, string> {
  const envResult = container.registerValue(environmentConfigToken, ENV);
  if (isErr(envResult)) {
    return err(`Failed to register EnvironmentConfig: ${envResult.error.message}`);
  }
  return ok(undefined);
}

function registerRuntimeConfig(container: ServiceContainer): Result<void, string> {
  const runtimeConfigAdapter = new RuntimeConfigAdapter(ENV);
  const runtimeConfigResult = container.registerValue(runtimeConfigToken, runtimeConfigAdapter);
  if (isErr(runtimeConfigResult)) {
    return err(`Failed to register RuntimeConfigAdapter: ${runtimeConfigResult.error.message}`);
  }
  return ok(undefined);
}

// ... weitere Funktionen

function registerStaticValues(container: ServiceContainer): Result<void, string> {
  const results = [
    registerEnvironmentConfig(container),
    registerRuntimeConfig(container),
    registerServiceContainer(container),
    registerPlatformContainerPortAlias(container),
    registerModuleId(container),
  ];

  for (const result of results) {
    if (isErr(result)) return result;
  }

  return ok(undefined);
}
```

**Option 2: Keine Änderung (Akzeptabel)**
Die aktuelle Implementierung ist für Bootstrap-Code akzeptabel, da:
- Alle Registrierungen sind eng verwandt (statische Bootstrap-Werte)
- Die Funktion ist gut lesbar und dokumentiert
- Die Komplexität ist überschaubar (42 Zeilen)

## Example Fix

Siehe Option 1 in Recommendation.

## Notes

- Die Funktion ist relativ klein (42 Zeilen)
- Alle Registrierungen sind semantisch verwandt (statische Bootstrap-Werte)
- Dies ist eher eine Beobachtung als ein kritisches Problem
- Die Refactoring würde die Testbarkeit verbessern, ist aber optional

