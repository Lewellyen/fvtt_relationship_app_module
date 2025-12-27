# DI-Token-Katalog

**Zweck:** Vollständige Übersicht aller Injection Tokens im Projekt
**Zielgruppe:** Entwickler, Architekten
**Letzte Aktualisierung:** 2025-12-15
**Projekt-Version:** 0.44.0

---

## Übersicht

Tokens sind type-safe Identifier für Services im DI-Container. Sie ermöglichen lose Kopplung und garantieren Type Safety bei der Service-Resolution.

---

## Token-Konventionen

### Namensschema

```typescript
// Token-Namen: camelCase mit "Token"-Suffix
export const loggerToken: InjectionToken<Logger> = createToken<Logger>("logger");
export const cacheServiceToken: InjectionToken<CacheService> = createToken<CacheService>("cacheService");
```

### Token-Erstellung

```typescript
import { createToken, InjectionToken } from "@/infrastructure/di";

// Type-safe Token erstellen
export const myServiceToken: InjectionToken<MyService> = createToken<MyService>("myService");
```

---

## Core Infrastructure Tokens

### Logging & Observability

| Token | Typ | Lifecycle | Beschreibung |
|-------|-----|-----------|--------------|
| `loggerToken` | `Logger` | Singleton | Console Logger mit TraceContext |
| `metricsCollectorToken` | `MetricsCollector` | Singleton | Container-/Port-Metriken |
| `metricsRecorderToken` | `MetricsRecorder` | Singleton | Alias für MetricsCollector |
| `traceContextToken` | `TraceContext` | Singleton | Trace-ID-Propagation |
| `observabilityRegistryToken` | `ObservabilityRegistry` | Singleton | Self-Registration Hub |
| `portSelectionEventEmitterToken` | `PortSelectionEventEmitter` | Transient | Event Emitter für Port-Selection |

### Notifications

| Token | Typ | Lifecycle | Beschreibung |
|-------|-----|-----------|--------------|
| `notificationCenterToken` | `NotificationCenter` | Singleton | Channel-basierte Notifications |
| `consoleChannelToken` | `ConsoleChannel` | Singleton | Console-Output-Channel |
| `uiChannelToken` | `UIChannel` | Singleton | Foundry UI-Notifications |

### Health & Metrics

| Token | Typ | Lifecycle | Beschreibung |
|-------|-----|-----------|--------------|
| `moduleHealthServiceToken` | `ModuleHealthService` | Singleton | Aggregiert Health-Checks |
| `healthCheckRegistryToken` | `HealthCheckRegistry` | Singleton | Health-Check-Registry |
| `containerHealthCheckToken` | `ContainerHealthCheck` | Singleton | Container-Status-Check |
| `metricsHealthCheckToken` | `MetricsHealthCheck` | Singleton | Metrics-Status-Check |

---

## Foundry Adapter Tokens

### Port Infrastructure

| Token | Typ | Lifecycle | Beschreibung |
|-------|-----|-----------|--------------|
| `portSelectorToken` | `PortSelector` | Singleton | Version-agnostische Port-Auswahl |
| `foundryGamePortRegistryToken` | `PortRegistry<FoundryGame>` | Value | Game Port Registry |
| `foundryHooksPortRegistryToken` | `PortRegistry<FoundryHooks>` | Value | Hooks Port Registry |
| `foundryDocumentPortRegistryToken` | `PortRegistry<FoundryDocument>` | Value | Document Port Registry |
| `foundryUIPortRegistryToken` | `PortRegistry<FoundryUI>` | Value | UI Port Registry |
| `foundrySettingsPortRegistryToken` | `PortRegistry<FoundrySettings>` | Value | Settings Port Registry |
| `foundryI18nPortRegistryToken` | `PortRegistry<FoundryI18n>` | Value | I18n Port Registry |

### Foundry Services (Version-agnostisch)

| Token | Typ | Lifecycle | Beschreibung |
|-------|-----|-----------|--------------|
| `foundryGameToken` | `FoundryGame` | Singleton | Game-API Wrapper |
| `foundryHooksToken` | `FoundryHooks` | Singleton | Hooks-API Wrapper |
| `foundryDocumentToken` | `FoundryDocument` | Singleton | Document-API Wrapper |
| `foundryUIToken` | `FoundryUI` | Singleton | UI-API Wrapper |
| `foundrySettingsToken` | `FoundrySettings` | Singleton | Settings-API Wrapper |
| `foundryI18nToken` | `FoundryI18n` | Singleton | I18n-API Wrapper |

### Foundry V13 Ports (Version-spezifisch)

| Token | Typ | Lifecycle | Beschreibung |
|-------|-----|-----------|--------------|
| `foundryV13GamePortToken` | `FoundryV13GamePort` | Singleton | V13 Game Port |
| `foundryV13HooksPortToken` | `FoundryV13HooksPort` | Singleton | V13 Hooks Port |
| `foundryV13DocumentPortToken` | `FoundryV13DocumentPort` | Singleton | V13 Document Port |
| `foundryV13UIPortToken` | `FoundryV13UIPort` | Singleton | V13 UI Port |
| `foundryV13SettingsPortToken` | `FoundryV13SettingsPort` | Singleton | V13 Settings Port |
| `foundryV13I18nPortToken` | `FoundryV13I18nPort` | Singleton | V13 I18n Port |

---

## Business Layer Tokens

### Services

| Token | Typ | Lifecycle | Beschreibung |
|-------|-----|-----------|--------------|
| `journalVisibilityServiceToken` | `JournalVisibilityService` | Singleton | Journal-Visibility-Logik |
| `foundryJournalFacadeToken` | `FoundryJournalFacade` | Singleton | Kombiniert Game/Document/UI |
| `runtimeConfigServiceToken` | `RuntimeConfigService` | Singleton | Runtime-Konfiguration |

### I18n

| Token | Typ | Lifecycle | Beschreibung |
|-------|-----|-----------|--------------|
| `i18nFacadeToken` | `I18nFacadeService` | Singleton | Chain-of-Responsibility i18n |
| `foundryI18nServiceToken` | `FoundryI18nService` | Singleton | Foundry-basierte Übersetzungen |
| `localI18nServiceToken` | `LocalI18nService` | Singleton | JSON-basierte Übersetzungen |
| `fallbackTranslationHandlerToken` | `FallbackTranslationHandler` | Singleton | Chain-Terminator |

### Cache

| Token | Typ | Lifecycle | Beschreibung |
|-------|-----|-----------|--------------|
| `cacheServiceToken` | `CacheService` | Singleton | TTL-Cache mit Metrics |

---

## Registrar Tokens

| Token | Typ | Lifecycle | Beschreibung |
|-------|-----|-----------|--------------|
| `moduleSettingsRegistrarToken` | `ModuleSettingsRegistrar` | Singleton | Settings-Registrierung |
| `moduleEventRegistrarToken` | `ModuleEventRegistrar` | Singleton | Event-Listener-Registrierung |
| `moduleApiInitializerToken` | `ModuleApiInitializer` | Singleton | API Bootstrap |

---

## Domain Port Tokens

### Platform Ports

| Token | Typ | Lifecycle | Beschreibung |
|-------|-----|-----------|--------------|
| `platformNotificationPortToken` | `PlatformNotificationPort` | Singleton | Platform-agnostische Notifications |
| `cacheReaderPortToken` | `CacheReaderPort` | Singleton | Cache Read-Operationen (get, has, getMetadata) |
| `cacheWriterPortToken` | `CacheWriterPort` | Singleton | Cache Write-Operationen (set, delete, clear) |
| `cacheInvalidationPortToken` | `CacheInvalidationPort` | Singleton | Cache Invalidation (invalidateWhere) |
| `cacheStatsPortToken` | `CacheStatsPort` | Singleton | Cache Statistiken (getStatistics, size, isEnabled) |
| `cacheComputePortToken` | `CacheComputePort` | Singleton | Cache Compute-Operationen (getOrSet) |
| `platformI18nPortToken` | `PlatformI18nPort` | Singleton | Platform-agnostische i18n |
| `platformUIPortToken` | `PlatformUIPort` | Singleton | Platform-agnostische UI-Ops |
| `platformSettingsPortToken` | `PlatformSettingsPort` | Singleton | Platform-agnostische Settings |

### Collection & Repository Ports

| Token | Typ | Lifecycle | Beschreibung |
|-------|-----|-----------|--------------|
| `journalCollectionPortToken` | `JournalCollectionPort` | Singleton | Read-only Journal-Zugriff |
| `journalRepositoryToken` | `JournalRepository` | Singleton | CRUD Journal-Operationen |

---

## Utility Tokens

| Token | Typ | Lifecycle | Beschreibung |
|-------|-----|-----------|--------------|
| `retryServiceToken` | `RetryService` | Singleton | Exponential Backoff |
| `performanceTrackingServiceToken` | `PerformanceTrackingService` | Singleton | Sampling & Duration Tracking |

---

## Bootstrap Tokens

| Token | Typ | Lifecycle | Beschreibung |
|-------|-----|-----------|--------------|
| `environmentConfigToken` | `EnvironmentConfig` | Value | Build-Time ENV-Werte |
| `serviceContainerToken` | `ServiceContainer` | Value | Container-Referenz |
| `bootstrapInitHookServiceToken` | `BootstrapInitHookService` | Singleton | Init-Hook-Service |
| `bootstrapReadyHookServiceToken` | `BootstrapReadyHookService` | Singleton | Ready-Hook-Service |

---

## API-Safe Tokens

Folgende Tokens sind über die Public API (`game.modules.get(MODULE_ID).api.tokens`) verfügbar:

```typescript
const api = game.modules.get('fvtt_relationship_app_module').api;

// Verfügbare Tokens
api.tokens.loggerToken
api.tokens.journalVisibilityServiceToken
api.tokens.foundryGameToken
api.tokens.notificationCenterToken
// ... weitere
```

**Hinweis:** Nur als API-Safe markierte Tokens sind stabil. Interne Tokens können sich ohne Deprecation ändern.

---

## Token-Verwendung

### Service resolven

```typescript
// Im DI-Kontext
const logger = container.resolve(loggerToken);

// Via Public API
const api = game.modules.get('fvtt_relationship_app_module').api;
const logger = api.resolve(api.tokens.loggerToken);
```

### Neuen Token erstellen

```typescript
// 1. Token definieren (in passender tokens/-Datei)
export const myServiceToken: InjectionToken<MyService> = createToken<MyService>("myService");

// 2. Service registrieren (in passender config/-Datei)
container.registerClass(myServiceToken, DIMyService, ServiceLifecycle.SINGLETON);

// 3. Service resolven
const myService = container.resolve(myServiceToken);
```

---

## Token-Organisation

```
src/
├── domain/tokens/                    # Domain-Layer Tokens
├── application/tokens/               # Application-Layer Tokens
├── infrastructure/shared/tokens/     # Infrastructure Tokens
│   ├── infrastructure.tokens.ts      # Core Infrastructure
│   ├── foundry.tokens.ts             # Foundry-spezifisch
│   └── index.ts                      # Re-exports
└── framework/config/                 # Config-spezifische Tokens
```

---

## Weiterführende Dokumentation

- [Quick Reference](./quick-reference.md) - Service-Übersicht
- [Services](./services.md) - Service-Dokumentation
- [Patterns](../architecture/patterns.md) - DI-Pattern
- [Modul-Grenzen](../architecture/module-boundaries.md) - Token-Layer-Zuordnung

---

**Letzte Aktualisierung:** 2025-12-15
