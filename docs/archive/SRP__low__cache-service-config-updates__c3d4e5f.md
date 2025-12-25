---
principle: SRP
severity: low
confidence: medium
component_kind: class
component_name: "CacheService"
file: "src/infrastructure/cache/CacheService.ts"
location:
  start_line: 260
  end_line: 278
tags: ["responsibility", "cache", "configuration"]
---

# Problem

Die `CacheService`-Klasse enthält eine `updateConfig()`-Methode, die zur Runtime-Konfigurationssynchronisation dient. Während dies funktional sinnvoll ist, könnte diese Verantwortlichkeit als zusätzlicher Concern betrachtet werden, da die Klasse primär für Cache-Operationen (get, set, delete) zuständig ist.

## Evidence

```260:278:src/infrastructure/cache/CacheService.ts
  /**
   * Updates the cache service configuration at runtime.
   * Used by CacheConfigSync to synchronize RuntimeConfig changes.
   *
   * @param partial - Partial configuration to merge with existing config
   */
  public updateConfig(partial: Partial<CacheServiceConfig>): void {
    this.configManager.updateConfig(partial);

    if (!this.isEnabled) {
      this.clearStore();
      return;
    }

    const config = this.configManager.getConfig();
    if (typeof config.maxEntries === "number") {
      this.enforceCapacity();
    }
  }
```

Die Methode:
1. Aktualisiert die Konfiguration über `configManager`
2. Führt zusätzliche Logik aus (clearStore bei disabled, enforceCapacity bei maxEntries)
3. Kombiniert Konfigurationsmanagement mit Cache-Management

## Impact

- **Geringe Auswirkung**: Die Methode delegiert bereits an `configManager`, daher ist die Verletzung minimal
- **Zusätzliche Verantwortlichkeit**: Runtime-Config-Updates könnten als separater Concern betrachtet werden
- **Akzeptable Verletzung**: Die Config-Update-Logik ist eng mit Cache-Verhalten verknüpft (z.B. Capacity-Enforcement nach Config-Änderung)

## Recommendation

**Option 1: Keine Änderung (Empfohlen)**

Die aktuelle Implementierung ist akzeptabel, da:
- Die Methode bereits an `CacheConfigManager` delegiert
- Die zusätzliche Logik (clearStore, enforceCapacity) ist direkt relevant für Cache-Verhalten
- Die Trennung würde unnötige Komplexität einführen

**Option 2: Observer Pattern (Optional)**

Falls die Config-Update-Verantwortlichkeit als zu groß empfunden wird, könnte ein Observer-Pattern verwendet werden:

```typescript
export interface CacheConfigObserver {
  onConfigUpdated(config: CacheServiceConfig): void;
}

export class CacheService implements CacheServiceContract, CacheConfigObserver {
  // ...

  onConfigUpdated(config: CacheServiceConfig): void {
    if (!config.enabled) {
      this.clearStore();
      return;
    }
    if (typeof config.maxEntries === "number") {
      this.enforceCapacity();
    }
  }
}

// CacheConfigSync würde dann den Observer benachrichtigen
export class CacheConfigSync {
  constructor(
    private readonly cacheService: CacheConfigObserver,
    private readonly configManager: ICacheConfigManager
  ) {}

  syncConfig(partial: Partial<CacheServiceConfig>): void {
    this.configManager.updateConfig(partial);
    this.cacheService.onConfigUpdated(this.configManager.getConfig());
  }
}
```

## Example Fix

Falls Option 2 gewählt wird:

```typescript
// Neue Observer-Interface
export interface CacheConfigObserver {
  onConfigUpdated(config: CacheServiceConfig): void;
}

// CacheService implementiert Observer
export class CacheService implements CacheServiceContract, CacheConfigObserver {
  // updateConfig() wird entfernt
  // stattdessen:
  onConfigUpdated(config: CacheServiceConfig): void {
    if (!config.enabled) {
      this.clearStore();
      return;
    }
    const currentConfig = this.configManager.getConfig();
    if (typeof config.maxEntries === "number" &&
        config.maxEntries !== currentConfig.maxEntries) {
      this.enforceCapacity();
    }
  }
}

// CacheConfigSync verwendet Observer
export class CacheConfigSync {
  constructor(
    private readonly cacheService: CacheConfigObserver,
    private readonly configManager: ICacheConfigManager
  ) {}

  syncConfig(partial: Partial<CacheServiceConfig>): void {
    this.configManager.updateConfig(partial);
    this.cacheService.onConfigUpdated(this.configManager.getConfig());
  }
}
```

## Notes

- **Status**: Geringe Priorität - die aktuelle Implementierung ist funktional korrekt
- **Bestehende Delegation**: Die Klasse delegiert bereits an `CacheConfigManager`, daher ist die SRP-Verletzung minimal
- **Praktikabilität**: Option 1 (keine Änderung) wird empfohlen, da die zusätzliche Komplexität nicht gerechtfertigt ist
- **Bewertung**: Dies ist eher eine Beobachtung als ein kritisches Problem

