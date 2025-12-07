# Clean Architecture Schichtverletzungen - Analyse & Behebungsvorschläge

**Erstellungsdatum:** 2025-12-06
**Status:** Analyse abgeschlossen
**Model:** Claude Sonnet 4.5

---

## Zusammenfassung

Das Projekt verwendet Clean Code Architecture mit 4 Schichten:
1. **Domain** - Framework-unabhängige Geschäftslogik
2. **Application** - Anwendungslogik (Services, Use-Cases)
3. **Infrastructure** - Technische Infrastruktur (DI, Cache, Adapters)
4. **Framework** - Framework-Integration (Bootstrap, Config)

**Dependency Rule:** Äußere Schichten dürfen innere importieren, NICHT umgekehrt!

```
Framework → Infrastructure → Application → Domain
```

---

## Identifizierte Verletzungen

### 🔴 KRITISCH: Application Layer importiert direkt von Infrastructure

**Problem:** Application-Layer sollte nur Domain Ports verwenden, nicht direkt Infrastructure Services.

#### 1. `src/application/services/module-ready-service.ts`

**Verletzung:**
```typescript
import type { Logger } from "@/infrastructure/logging/logger.interface";
import { loggerToken } from "@/infrastructure/shared/tokens/core.tokens";
```

**Behebung:**
- `Logger` sollte über `PlatformLoggingPort` (Domain Port) verwendet werden
- `loggerToken` sollte über Domain Port Token ersetzt werden

**Vorschlag:**
```typescript
// Statt:
import type { Logger } from "@/infrastructure/logging/logger.interface";
import { loggerToken } from "@/infrastructure/shared/tokens/core.tokens";

// Sollte sein:
import type { PlatformLoggingPort } from "@/domain/ports/platform-logging-port.interface";
import { platformLoggingPortToken } from "@/application/tokens/domain-ports.tokens";
```

**Aktion:**
1. `ModuleReadyService` sollte `PlatformLoggingPort` statt `Logger` verwenden
2. `DIModuleReadyService.dependencies` sollte `platformLoggingPortToken` statt `loggerToken` verwenden

---

#### 2. `src/application/settings/log-level-setting.ts`

**Verletzung:**
```typescript
import { validateAndSetLogLevel } from "@/infrastructure/shared/utils/validate-log-level";
```

**Behebung:**
- `validateAndSetLogLevel` sollte in Application Layer verschoben werden (ist Application-Logic)
- Oder als Domain Utility, wenn es platform-agnostisch ist

**Vorschlag:**
- Verschiebe `validate-log-level.ts` nach `src/application/utils/validate-log-level.ts`
- Oder nach `src/domain/utils/validate-log-level.ts` wenn es Domain-Logic ist

**Aktion:**
1. Datei verschieben: `src/infrastructure/shared/utils/validate-log-level.ts` → `src/application/utils/validate-log-level.ts`
2. Import in `log-level-setting.ts` aktualisieren
3. Alle anderen Imports dieser Datei prüfen und aktualisieren

---

#### 3. `src/application/health/*.ts` (HealthCheckRegistry, ContainerHealthCheck, MetricsHealthCheck)

**Verletzung:**
```typescript
import type { Disposable } from "@/infrastructure/di/interfaces";
import type { Container } from "@/infrastructure/di/interfaces";
import type { MetricsCollector } from "@/infrastructure/observability/metrics-collector";
import { ...Token } from "@/infrastructure/shared/tokens/...";
```

**Behebung:**
- Eigenes `Disposable`-Interface im Application-Layer definieren.
- `ContainerHealthCheck` gegen Domain-Port `PlatformContainerPort` arbeiten lassen (Token im Application-Layer bereitstellen).
- `MetricsHealthCheck` nur über einen Observability-Port (z. B. `MetricsSnapshotPort`) statt Infra-Collector/-Token koppeln.

**Aktion:**
1. Neues Application-Interface (z. B. `ApplicationDisposable`) einführen und in den Health-Dateien verwenden.
2. Domain-Port `PlatformContainerPort` plus passenden App-Token injizieren.
3. Observability-Port definieren (liefert Snapshot) und in `MetricsHealthCheck` injizieren; Infrastruktur-Imports entfernen.

---

#### 4. `src/application/services/ModuleSettingsRegistrar.ts`

**Verletzung:**
```typescript
import { loggerToken, runtimeConfigToken } from "@/infrastructure/shared/tokens/core.tokens";
import { platformSettingsRegistrationPortToken } from "@/infrastructure/shared/tokens/ports.tokens";
```

**Behebung:**
- Logging-, RuntimeConfig- und Settings-Ports über Domain/App-Tokens bereitstellen (keine Infra-Tokens im App-Layer).
- `validate-log-level`-Helper in App/Domain umziehen (siehe Punkt 2) und dort importieren.

**Aktion:**
1. App-eigene Tokens für Logging/RuntimeConfig/Settings-Registration definieren.
2. Constructor/Tokens auf diese App-Tokens umstellen.
3. Helper-Import auf App/Domain-Utility anpassen.

---

#### 5. `src/application/services/ModuleEventRegistrar.ts`

**Verletzung:**
```typescript
import { disposeHooks } from "@/infrastructure/shared/utils/dispose-hooks";
import { ...UseCaseToken } from "@/infrastructure/shared/tokens/event.tokens";
```

**Behebung:**
- Helper `dispose-hooks` in den Application-Layer verlagern (oder lokal halten).
- Event-/UseCase-Tokens im Application-Layer definieren.

**Aktion:**
1. Helper nach `src/application/utils` verschieben und Import anpassen.
2. Tokens in App-Tokens-Datei anlegen und Dependencies anpassen.

---

#### 6. `src/application/use-cases/register-context-menu.use-case.ts`

**Verletzung:**
```typescript
import { loggerToken } from "@/infrastructure/shared/tokens/core.tokens";
```

**Behebung:**
- Domain-Logging-Port (`PlatformLoggingPort`) und App-Token verwenden.

**Aktion:**
1. App-Token für Logging nutzen.
2. Dependencies auf Domain-Port + App-Token umstellen.

---

#### 7. `src/application/tokens/*.ts` (allgemein)

**Verletzung:**
```typescript
import { createInjectionToken } from "@/infrastructure/di/token-factory";
```

**Behebung:**
- Token-Fabrik in den Application- oder Domain-Layer verschieben (oder minimalen `createInjectionToken` im App-Layer bereitstellen).
- Danach alle Token-Dateien auf die neue Fabrik umstellen, damit App nicht von Infra abhängt.

**Aktion:**
1. Neue Token-Fabrik im App/Domain-Layer erstellen.
2. Imports in allen Token-Dateien anpassen.
3. Alte Infra-Abhängigkeit entfernen.

---

#### 8. `src/application/tokens/domain-ports.tokens.ts`

**Status:** ✅ **OK** - Tokens sind technische Infrastruktur

**Begründung:** Tokens gehören zur DI-Infrastruktur. Es ist korrekt, dass sie `createInjectionToken` von Infrastructure importieren.

---

### 🔴 KRITISCH: Infrastructure Layer importiert von Framework

**Problem:** Infrastructure sollte nicht von Framework abhängen (Framework ist äußerste Schicht).

#### 1. `src/infrastructure/di/container.ts`

**Verletzung:**
```typescript
import { ENV } from "@/framework/config/environment";
```

**Behebung:**
- `ENV` sollte über Domain Port oder als Dependency Injection bereitgestellt werden
- `EnvironmentConfig` ist bereits ein Domain Type (`@/domain/types/environment-config`)

**Vorschlag:**
- `ENV` sollte als Value im Container registriert werden (bereits implementiert)
- `container.ts` sollte `ENV` nicht direkt importieren, sondern über Constructor-Dependency erhalten

**Aktion:**
1. `ServiceContainer` sollte `EnvironmentConfig` als Constructor-Parameter erhalten
2. `ENV` wird in `dependencyconfig.ts` als Value registriert
3. `container.ts` entfernt direkten Import von `ENV`
4. Stattdessen: `EnvironmentConfig` wird über DI bereitgestellt

**Alternative (einfacher):**
- `ENV` als Domain Constant definieren (aber das ist eigentlich Framework-Config)
- Oder: `ENV` bleibt in Framework, wird aber über Domain Port bereitgestellt

---

#### 2. `src/infrastructure/logging/BootstrapLogger.ts`

**Verletzung:**
```typescript
import { ENV } from "@/framework/config/environment";
import { createRuntimeConfig } from "@/application/services/runtime-config-factory";
```

**Behebung:**
- `BootstrapLogger` sollte `EnvironmentConfig` als Constructor-Parameter erhalten
- `createRuntimeConfig` ist OK (Application → Infrastructure ist erlaubt)

**Vorschlag:**
```typescript
// Statt:
export class BootstrapLoggerService extends ConsoleLoggerService {
  constructor() {
    super(createRuntimeConfig(ENV));
  }
}

// Sollte sein:
export class BootstrapLoggerService extends ConsoleLoggerService {
  constructor(env: EnvironmentConfig) {
    super(createRuntimeConfig(env));
  }
}

// Factory:
export function createBootstrapLogger(env: EnvironmentConfig): Logger {
  return new BootstrapLoggerService(env);
}
```

**Aktion:**
1. `BootstrapLoggerService` Constructor erhält `EnvironmentConfig` Parameter
2. `createBootstrapLogger()` Factory erhält `EnvironmentConfig` Parameter
3. Alle Aufrufer müssen `ENV` übergeben (z.B. in `CompositionRoot`)

---

### 🔴 KRITISCH: Infrastruktur exportiert Application-Tokens (Richtungsbruch)

**Problem:** `src/infrastructure/shared/tokens/index.ts` re-exportiert Application-Tokens. Konsumenten importieren damit App-Tokens über die Infrastruktur-Schicht, was die Abhängigkeitsrichtung umkehrt.

**Behebung:**
- Re-Exports der Application-Tokens aus `infrastructure/shared/tokens/index.ts` entfernen.
- Call-Sites auf direkte Importe aus `src/application/tokens/...` umstellen.

**Aktion:**
1. Re-Exports streichen.
2. Framework/Infra/Tests auf direkte App-Token-Imports korrigieren.

---

### 🟡 WARNUNG: Constants sollten in Domain Layer sein

**Status:** ⚠️ **Nicht kritisch, aber verbesserungswürdig**

**Problem:**
- `src/infrastructure/cache/CacheService.ts` importiert `APP_DEFAULTS` von Application
- Constants sollten in Domain Layer sein (platform-agnostisch)
- **Hinweis:** Infrastructure → Application ist erlaubt, aber Constants gehören in Domain

**Verletzung:**
```typescript
import { APP_DEFAULTS } from "@/application/constants/app-constants";
```

**Behebung:**
- `APP_DEFAULTS` sollte nach Domain Layer verschoben werden
- Oder: Cache-spezifische Defaults sollten in Domain Constants sein

**Vorschlag:**
- Verschiebe `APP_DEFAULTS` nach `src/domain/constants/domain-constants.ts`
- Oder: Erstelle `src/domain/constants/cache-constants.ts` für Cache-spezifische Defaults

**Aktion (Optional):**
1. Prüfe, welche Constants in `APP_DEFAULTS` sind
2. Verschiebe Cache-spezifische Defaults nach Domain
3. Aktualisiere alle Imports

---

### 🟡 WARNUNG: Token-Definitionen in Application Layer

**Status:** ⚠️ **Diskutierbar** - Technisch OK, aber könnte besser strukturiert sein

**Problem:**
- `src/application/tokens/domain-ports.tokens.ts` definiert Tokens für Domain Ports
- Tokens sind technische Infrastruktur (DI)

**Vorschlag:**
- Tokens könnten in `src/infrastructure/shared/tokens/` verschoben werden
- Oder: Application Layer behält Tokens für Domain Ports (ist OK, da Application diese verwendet)

**Empfehlung:** ✅ **Behalten** - Application Layer definiert Tokens für Domain Ports, die es verwendet. Das ist korrekt.

---

### 🟢 OK: Tests importieren von verschiedenen Schichten

**Status:** ✅ **OK** - Tests stehen außerhalb der Architektur

**Begründung:** Tests dürfen von allen Schichten importieren, da sie außerhalb der Produktions-Architektur stehen.

---

## Zusammenfassung der Behebungen

### Priorität 1 (KRITISCH - Schichtschranken verletzt)

1. **`module-ready-service.ts`**: `Logger` → `PlatformLoggingPort` (Application importiert Infrastructure direkt)
2. **`application/health/*.ts`**: Infra-Interfaces/Tokens/Collector entfernen; Domain-Port + App-Token + eigener Disposable/Observability-Port nutzen
3. **`ModuleSettingsRegistrar.ts`**: Logging/RuntimeConfig/Settings über App-Tokens/Domain-Ports; keine Infra-Tokens
4. **`ModuleEventRegistrar.ts`**: Infra-Helper/Tokens entfernen; Helper + Tokens in App-Layer
5. **`register-context-menu.use-case.ts`**: Logging-Port + App-Token statt Infra-Token
6. **`application/tokens/*.ts`**: Token-Fabrik in App/Domain verlagern; keine Importkette zur Infrastruktur
7. **`container.ts`**: `ENV` Import entfernen, über DI bereitstellen (Infrastructure importiert Framework)
8. **`BootstrapLogger.ts`**: `ENV` Import entfernen, über Constructor-Parameter (Infrastructure importiert Framework)
9. **`infrastructure/shared/tokens/index.ts`**: Re-Exports der Application-Tokens streichen (Richtungsbruch)

### Priorität 2 (WICHTIG - Code-Organisation)

10. **`log-level-setting.ts`**: `validate-log-level.ts` nach Application Layer verschieben (Utility gehört in Application)
11. **`app-constants.ts`**: `APP_DEFAULTS` nach Domain Layer verschieben (Constants gehören in Domain)

---

## Behebungsplan

### Schritt 1: Logger → PlatformLoggingPort Migration

**Dateien:**
- `src/application/services/module-ready-service.ts`

**Änderungen:**
```typescript
// Vorher:
import type { Logger } from "@/infrastructure/logging/logger.interface";
import { loggerToken } from "@/infrastructure/shared/tokens/core.tokens";

export class ModuleReadyService {
  constructor(
    private readonly moduleReadyPort: PlatformModuleReadyPort,
    private readonly logger: Logger
  ) {}

  setReady(): void {
    // ...
    this.logger.warn(...);
    this.logger.info(...);
  }
}

// Nachher:
import type { PlatformLoggingPort } from "@/domain/ports/platform-logging-port.interface";
import { platformLoggingPortToken } from "@/application/tokens/domain-ports.tokens";

export class ModuleReadyService {
  constructor(
    private readonly moduleReadyPort: PlatformModuleReadyPort,
    private readonly loggingPort: PlatformLoggingPort
  ) {}

  setReady(): void {
    // ...
    this.loggingPort.warn(...);
    this.loggingPort.info(...);
  }
}
```

**Prüfen:**
- Gibt es bereits `PlatformLoggingPort`? → Ja, in `src/domain/ports/platform-logging-port.interface.ts`
- Gibt es bereits Token? → Prüfen, ggf. in `domain-ports.tokens.ts` hinzufügen

---

### Schritt 2: ENV Dependency Injection in Container

**Dateien:**
- `src/infrastructure/di/container.ts`

**Änderungen:**
```typescript
// Vorher:
import { ENV } from "@/framework/config/environment";

export class ServiceContainer {
  // ENV wird direkt verwendet
}

// Nachher:
export class ServiceContainer {
  constructor(private readonly env: EnvironmentConfig) {
    // ENV wird über Constructor bereitgestellt
  }
}
```

**Prüfen:**
- Wo wird `ServiceContainer` erstellt? → `ServiceContainer.createRoot()` Factory
- `createRoot()` sollte `ENV` übergeben

---

### Schritt 3: BootstrapLogger ENV Dependency

**Dateien:**
- `src/infrastructure/logging/BootstrapLogger.ts`

**Änderungen:**
```typescript
// Vorher:
import { ENV } from "@/framework/config/environment";

export class BootstrapLoggerService extends ConsoleLoggerService {
  constructor() {
    super(createRuntimeConfig(ENV));
  }
}

export function createBootstrapLogger(): Logger {
  return new BootstrapLoggerService();
}

// Nachher:
export class BootstrapLoggerService extends ConsoleLoggerService {
  constructor(env: EnvironmentConfig) {
    super(createRuntimeConfig(env));
  }
}

export function createBootstrapLogger(env: EnvironmentConfig): Logger {
  return new BootstrapLoggerService(env);
}
```

**Aufrufer aktualisieren:**
- `src/framework/core/composition-root.ts`
- Alle anderen Stellen, die `createBootstrapLogger()` aufrufen

---

### Schritt 4: validate-log-level verschieben

**Dateien:**
- `src/infrastructure/shared/utils/validate-log-level.ts` → `src/application/utils/validate-log-level.ts`
- `src/application/settings/log-level-setting.ts` (Import aktualisieren)

**Prüfen:**
- Gibt es andere Imports von `validate-log-level.ts`? → Ja, prüfen und aktualisieren

---

## Validierung nach Behebung

### Checkliste

- [ ] Keine Imports von `@/infrastructure` in `src/application/` (außer Tokens)
- [ ] Keine Imports von `@/framework` in `src/infrastructure/` (außer Tests)
- [ ] Keine Imports von `@/application` in `src/domain/`
- [ ] Alle Services verwenden Domain Ports statt Infrastructure Services
- [ ] Alle Tests bestehen weiterhin

### Automatisierung

**ESLint-Regel vorschlagen:**
```json
{
  "rules": {
    "import/no-restricted-paths": [
      "error",
      {
        "zones": [
          {
            "target": "./src/application/**",
            "from": "./src/infrastructure/**",
            "message": "Application Layer darf nicht direkt von Infrastructure importieren. Verwende Domain Ports."
          },
          {
            "target": "./src/infrastructure/**",
            "from": "./src/framework/**",
            "message": "Infrastructure Layer darf nicht von Framework importieren."
          },
          {
            "target": "./src/domain/**",
            "from": "./src/application/**",
            "message": "Domain Layer darf nicht von Application importieren."
          }
        ]
      }
    ]
  }
}
```

---

## Weitere Empfehlungen

### 1. Domain Port für EnvironmentConfig

**Vorschlag:** `PlatformEnvironmentPort` erstellen, falls `ENV` häufig benötigt wird.

**Aktuell:** `ENV` wird hauptsächlich in Bootstrap-Phase verwendet → OK als Constructor-Parameter.

### 2. Token-Organisation

**Aktuell:**
- `src/application/tokens/domain-ports.tokens.ts` - Domain Port Tokens
- `src/infrastructure/shared/tokens/` - Infrastructure Tokens

**Empfehlung:** ✅ **Behalten** - Application definiert Tokens für Domain Ports, die es verwendet.

---

## Referenzen

- [ADR-0007: Clean Architecture Layering](./adr/0007-clean-architecture-layering.md)
- [ARCHITECTURE.md](../ARCHITECTURE.md)
- [PROJECT-ANALYSIS.md](./PROJECT-ANALYSIS.md)

---

**Letzte Aktualisierung:** 2025-12-06
