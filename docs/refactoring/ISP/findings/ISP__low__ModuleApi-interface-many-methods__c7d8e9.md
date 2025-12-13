---
principle: ISP
severity: low
confidence: high
component_kind: interface
component_name: "ModuleApi"
file: "src/framework/core/api/module-api.ts"
location:
  start_line: 101
  end_line: 255
tags: ["interface", "api", "segregation", "public-api"]
---

# Problem

Das `ModuleApi` Interface definiert 7 verschiedene Methoden/Eigenschaften für externe API-Consumer. Während alle Methoden für eine Public API sinnvoll sind, könnte ein Client, der nur Service-Resolution benötigt, gezwungen sein, das gesamte Interface zu implementieren (obwohl dies hier ein Object-Literal ist, nicht eine Klasse).

## Evidence

```101:255:src/framework/core/api/module-api.ts
export interface ModuleApi {
  /**
   * API version following semantic versioning (MAJOR.MINOR.PATCH).
   */
  readonly version: "1.0.0";

  /**
   * Resolves a service from the DI container (throws on failure).
   */
  resolve: <TServiceType>(token: ApiSafeToken<TServiceType>) => TServiceType;

  /**
   * Resolves a service by its injection token with Result-Pattern (never throws).
   */
  resolveWithError: <TServiceType>(
    token: ApiSafeToken<TServiceType>
  ) => Result<TServiceType, ContainerError>;

  /**
   * Lists all registered service tokens with their descriptions.
   */
  getAvailableTokens: () => Map<InjectionTokenKey, TokenInfo>;

  /**
   * Well-known tokens exported by this module for easy access.
   */
  tokens: ModuleApiTokens;

  /**
   * Gets a snapshot of performance metrics.
   */
  getMetrics: () => MetricsSnapshot;

  /**
   * Gets module health status.
   */
  getHealth: () => HealthStatus;
}
```

**7 Eigenschaften/Methoden:**
1. `version` - API-Version
2. `resolve` - Service-Resolution (exception-based)
3. `resolveWithError` - Service-Resolution (Result-Pattern)
4. `getAvailableTokens` - Token-Discovery
5. `tokens` - Well-known tokens collection
6. `getMetrics` - Performance-Metriken
7. `getHealth` - Health-Status

**Potenzielle Client-Kategorien:**
- **Service-Resolver**: Braucht nur `resolve`/`resolveWithError` und `tokens`
- **Diagnostics**: Braucht nur `getMetrics` und `getHealth`
- **Discovery**: Braucht nur `getAvailableTokens`
- **Full API**: Braucht alles

## Impact

- **Interface Segregation**: Clients müssen das gesamte Interface "implementieren" (auch wenn als Object-Literal)
- **Testbarkeit**: Mocks müssen alle Methoden implementieren
- **Klare Abgrenzung**: Weniger klare Trennung zwischen verschiedenen API-Bereichen

## Recommendation

**Option 1: Separate Interfaces (Empfohlen für bessere Segregation)**
Erstelle separate Interfaces für verschiedene API-Bereiche:

```typescript
export interface ServiceResolutionApi {
  resolve: <TServiceType>(token: ApiSafeToken<TServiceType>) => TServiceType;
  resolveWithError: <TServiceType>(token: ApiSafeToken<TServiceType>) => Result<TServiceType, ContainerError>;
  tokens: ModuleApiTokens;
}

export interface DiscoveryApi {
  getAvailableTokens: () => Map<InjectionTokenKey, TokenInfo>;
}

export interface DiagnosticsApi {
  getMetrics: () => MetricsSnapshot;
  getHealth: () => HealthStatus;
}

export interface ModuleApiMetadata {
  readonly version: "1.0.0";
}

export interface ModuleApi extends ModuleApiMetadata, ServiceResolutionApi, DiscoveryApi, DiagnosticsApi {}
```

**Option 2: Keine Änderung (Akzeptabel für Public API)**
Die aktuelle Implementierung ist für eine Public API akzeptabel, da:
- Es ist ein Object-Literal, keine Klasse-Implementierung
- Alle Methoden sind für externe Consumer relevant
- Die Komplexität ist überschaubar (7 Methoden)
- Die API wird als ganzes Objekt exponiert, nicht als einzelne Interfaces

## Example Fix

Siehe Option 1 in Recommendation.

## Notes

- Da `ModuleApi` als Object-Literal implementiert wird, ist ISP hier weniger kritisch
- Alle Methoden sind für eine vollständige Public API sinnvoll
- Dies ist eher eine Beobachtung als ein kritisches Problem
- Die Segregation würde die Testbarkeit verbessern (kleinere Mocks), ist aber optional

