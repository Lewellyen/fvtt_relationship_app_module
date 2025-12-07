# Layer-Violations Analyse

**Datum:** 2025-12-07
**Status:** ⚠️ Verletzungen gefunden
**Model:** Claude Sonnet 4.5

## Schichttrennung-Regeln

Gemäß Clean Architecture sollten die folgenden Dependency-Regeln gelten:

1. **Domain Layer** (`src/domain/`):
   - ✅ Keine Abhängigkeiten zu anderen Layern
   - ✅ Nur Domain-Interne Imports

2. **Application Layer** (`src/application/`):
   - ✅ Nur Domain-Layer
   - ❌ **NICHT** Infrastructure oder Framework

3. **Infrastructure Layer** (`src/infrastructure/`):
   - ✅ Domain + Application + Infrastructure
   - ❌ **NICHT** Framework

4. **Framework Layer** (`src/framework/`):
   - ✅ Alle anderen Layer

## Gefundene Verletzungen

### ❌ Application → Infrastructure (Verletzung!)

**Dateien, die Infrastructure importieren:**

1. **`src/application/services/RuntimeConfigSync.ts`** (Zeile 13)
   ```typescript
   import { runtimeConfigToken } from "@/infrastructure/shared/tokens/core/runtime-config.token";
   ```
   **Problem:** Application-Layer importiert Token von Infrastructure
   **Lösung:** Token sollte in Application-Layer definiert werden oder über Domain-Port

2. **`src/application/services/ModuleSettingsRegistrar.ts`** (Zeile 18)
   ```typescript
   import { platformSettingsRegistrationPortToken } from "@/infrastructure/shared/tokens/ports/platform-settings-registration-port.token";
   ```
   **Problem:** Application-Layer importiert Token von Infrastructure
   **Lösung:** Token sollte in Application-Layer definiert werden

3. **`src/application/services/ModuleHealthService.ts`** (Zeile 3)
   ```typescript
   import { healthCheckRegistryToken } from "@/infrastructure/shared/tokens/core/health-check-registry.token";
   ```
   **Problem:** Application-Layer importiert Token von Infrastructure
   **Lösung:** Token sollte in Application-Layer definiert werden

4. **`src/application/services/module-ready-service.ts`** (Zeile 10, 13)
   ```typescript
   import { platformModuleReadyPortToken } from "@/infrastructure/shared/tokens/ports/platform-module-ready-port.token";
   import type { InjectionToken } from "@/infrastructure/di/types/core/injectiontoken";
   ```
   **Problem:** Application-Layer importiert Token und Types von Infrastructure
   **Lösung:** Token sollte in Application-Layer definiert werden, Type sollte über Domain-Port

5. **`src/application/health/ContainerHealthCheck.ts`** (Zeile 4)
   ```typescript
   import { healthCheckRegistryToken } from "@/infrastructure/shared/tokens/core/health-check-registry.token";
   ```
   **Problem:** Application-Layer importiert Token von Infrastructure
   **Lösung:** Token sollte in Application-Layer definiert werden

6. **`src/application/health/MetricsHealthCheck.ts`** (Zeile 3)
   ```typescript
   import { healthCheckRegistryToken } from "@/infrastructure/shared/tokens/core/health-check-registry.token";
   ```
   **Problem:** Application-Layer importiert Token von Infrastructure
   **Lösung:** Token sollte in Application-Layer definiert werden

7. **`src/application/utils/token-factory.ts`** (Zeile 11-12)
   ```typescript
   import { createInjectionToken as createInfrastructureToken } from "@/infrastructure/di/token-factory";
   import type { InjectionToken } from "@/infrastructure/di/types/core/injectiontoken";
   ```
   **Problem:** Application-Layer importiert direkt von Infrastructure
   **Lösung:** Wrapper ist gut, aber Type-Import sollte über Domain-Layer gehen

### ❌ Infrastructure → Framework (Verletzung!)

**Dateien, die Framework importieren:**

1. **`src/infrastructure/shared/tokens/infrastructure/module-api-initializer.token.ts`** (Zeile 8)
   ```typescript
   import type { ModuleApiInitializer } from "@/framework/core/api/module-api-initializer";
   ```
   **Problem:** Infrastructure-Layer importiert Type von Framework
   **Lösung:** Type sollte in Infrastructure-Layer definiert werden oder über Domain-Port

2. **`src/infrastructure/shared/tokens/core/bootstrap-ready-hook-service.token.ts`** (Zeile 8)
   ```typescript
   import type { BootstrapReadyHookService } from "@/framework/core/bootstrap-ready-hook";
   ```
   **Problem:** Infrastructure-Layer importiert Type von Framework
   **Lösung:** Type sollte in Infrastructure-Layer definiert werden oder über Domain-Port

3. **`src/infrastructure/shared/tokens/core/bootstrap-init-hook-service.token.ts`** (Zeile 8)
   ```typescript
   import type { BootstrapInitHookService } from "@/framework/core/bootstrap-init-hook";
   ```
   **Problem:** Infrastructure-Layer importiert Type von Framework
   **Lösung:** Type sollte in Infrastructure-Layer definiert werden oder über Domain-Port

## Zusammenfassung

### Verletzungen nach Layer:

- **Application → Infrastructure:** 7 Dateien
- **Infrastructure → Framework:** 3 Dateien

### Gesamt: 10 Verletzungen

## Empfohlene Lösungen

### 1. Token-Definitionen verschieben

**Problem:** Tokens werden in Infrastructure definiert, aber von Application verwendet.

**Lösung:**
- Application-spezifische Tokens sollten in `src/application/tokens/` definiert werden
- Infrastructure-Tokens sollten nur in Infrastructure verwendet werden
- Domain-Ports sollten über Application-Tokens verfügbar gemacht werden

### 2. Type-Definitionen verschieben

**Problem:** Types werden in Framework definiert, aber von Infrastructure verwendet.

**Lösung:**
- Types sollten in der gleichen oder einer inneren Schicht definiert werden
- Framework-Types sollten nicht von Infrastructure importiert werden
- Interfaces sollten in Domain oder Infrastructure definiert werden

### 3. Dependency Inversion anwenden

**Problem:** Direkte Abhängigkeiten auf konkrete Implementierungen.

**Lösung:**
- Domain-Ports für alle Abstraktionen verwenden
- Application-Layer sollte nur Domain-Ports verwenden
- Infrastructure implementiert Domain-Ports

## Nächste Schritte

1. ✅ Verletzungen dokumentiert
2. ⏳ Token-Definitionen analysieren und verschieben
3. ⏳ Type-Definitionen analysieren und verschieben
4. ⏳ Refactoring durchführen
5. ⏳ Tests aktualisieren
6. ⏳ Dokumentation aktualisieren

