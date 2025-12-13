---
principle: DIP
severity: medium
confidence: high
component_kind: function
component_name: "configureDependencies / registerStaticValues"
file: "src/framework/config/dependencyconfig.ts"
location:
  start_line: 13
  end_line: 19
  start_line: 45
  end_line: 87
tags: ["dependency-inversion", "infrastructure", "concrete-class", "adapter"]
---

# Problem

Die Funktion `registerStaticValues` (und damit `configureDependencies`) importiert konkrete Klassen aus dem Infrastructure-Layer direkt:

- `RuntimeConfigAdapter` (konkrete Klasse)
- `DIContainerHealthCheck` (wird in `registerLoopPreventionServices` verwendet)
- `DIMetricsHealthCheck` (wird in `registerLoopPreventionServices` verwendet)
- `ServiceContainer` (konkrete Klasse, aber notwendig für Container-Erstellung)

Dies verletzt das Dependency Inversion Principle, da der Framework-Layer von konkreten Implementierungen abhängt statt von Abstraktionen.

## Evidence

```13:19:src/framework/config/dependencyconfig.ts
import { RuntimeConfigAdapter } from "@/infrastructure/config/runtime-config-adapter";
import { DIContainerHealthCheck } from "@/application/health/ContainerHealthCheck";
import { DIMetricsHealthCheck } from "@/application/health/MetricsHealthCheck";
import { ServiceLifecycle } from "@/infrastructure/di/types/core/servicelifecycle";
```

```51:55:src/framework/config/dependencyconfig.ts
  const runtimeConfigAdapter = new RuntimeConfigAdapter(ENV);
  const runtimeConfigResult = container.registerValue(runtimeConfigToken, runtimeConfigAdapter);
  if (isErr(runtimeConfigResult)) {
    return err(`Failed to register RuntimeConfigAdapter: ${runtimeConfigResult.error.message}`);
  }
```

```100:116:src/framework/config/dependencyconfig.ts
function registerLoopPreventionServices(container: ServiceContainer): Result<void, string> {
  const containerCheckResult = container.registerClass(
    containerHealthCheckToken,
    DIContainerHealthCheck,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(containerCheckResult)) {
    return err(`Failed to register ContainerHealthCheck: ${containerCheckResult.error.message}`);
  }

  const metricsCheckResult = container.registerClass(
    metricsHealthCheckToken,
    DIMetricsHealthCheck,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(metricsCheckResult)) {
    return err(`Failed to register MetricsHealthCheck: ${metricsCheckResult.error.message}`);
  }

  return ok(undefined);
}
```

**Konkrete Abhängigkeiten:**
1. `RuntimeConfigAdapter` - Konkrete Klasse aus Infrastructure
2. `DIContainerHealthCheck` - Konkrete Klasse aus Application
3. `DIMetricsHealthCheck` - Konkrete Klasse aus Application
4. `ServiceContainer` - Konkrete Klasse (aber notwendig für Framework-Layer)

## Impact

- **Tight Coupling**: Framework-Layer ist direkt an Infrastructure-Implementierungen gekoppelt
- **Testbarkeit**: Schwerer zu testen, da konkrete Klassen verwendet werden
- **Austauschbarkeit**: Könnte schwieriger sein, alternative Implementierungen zu verwenden
- **Layer-Violation**: Framework-Layer sollte nur Abstraktionen (Interfaces/Ports) verwenden

## Recommendation

**Option 1: Factory-Funktionen (Empfohlen)**
Erstelle Factory-Funktionen im Infrastructure-Layer, die vom Framework-Layer aufgerufen werden:

```typescript
// In infrastructure/config/runtime-config-adapter.ts:
export function createRuntimeConfigAdapter(env: EnvironmentConfig): RuntimeConfigAdapter {
  return new RuntimeConfigAdapter(env);
}

// In framework/config/dependencyconfig.ts:
import { createRuntimeConfigAdapter } from "@/infrastructure/config/runtime-config-adapter";

function registerStaticValues(container: ServiceContainer): Result<void, string> {
  // ...
  const runtimeConfigAdapter = createRuntimeConfigAdapter(ENV);
  // ...
}
```

**Option 2: Dependency Injection für Factories**
Verwende Factories, die über DI bereitgestellt werden:

```typescript
// Factory-Interface im Domain-Layer:
export interface RuntimeConfigFactory {
  create(env: EnvironmentConfig): RuntimeConfig;
}

// In Framework-Layer:
// Factory wird über DI bereitgestellt, Framework-Layer kennt nur Interface
```

**Option 3: Keine Änderung (Akzeptabel für Framework-Layer)**
Die aktuelle Implementierung ist für einen Framework-Layer akzeptabel, da:
- Framework-Layer ist die äußerste Schicht und darf auf alle inneren Layer zugreifen
- Die direkten Imports sind für Bootstrap/Configuration notwendig
- Die Komplexität durch Factory-Funktionen würde erhöht werden
- RuntimeConfigAdapter ist ein Adapter, der ohnehin im Framework-Layer-Kontext verwendet wird

## Example Fix

Siehe Option 1 in Recommendation.

## Notes

- Framework-Layer hat eine Sonderstellung: Er ist die äußerste Schicht und orchestriert die Bootstrapping
- Die direkten Imports sind für die Dependency-Configuration notwendig
- Dies ist eine Design-Entscheidung: Framework-Layer darf auf konkrete Implementierungen zugreifen für Configuration
- Ein Refactoring würde die Abstraktion verbessern, könnte aber die Komplexität erhöhen

