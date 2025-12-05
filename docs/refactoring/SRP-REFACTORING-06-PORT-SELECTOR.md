# SRP Refactoring Plan: PortSelector

**Status:** 📋 Geplant
**Priorität:** 🟡 Niedrig
**Erstellt:** 2025-01-XX
**Zweck:** Trennung der Port-Auswahl von Version-Detection

---

## Problem

`PortSelector` verletzt das Single Responsibility Principle (SRP) durch mehrere Verantwortlichkeiten:

1. **Port-Auswahl**: Kompatiblen Port basierend auf Version auswählen
2. **Version-Detection**: Foundry-Version ermitteln
3. **Event-Emission**: Port-Selection-Events emittieren
4. **Container-Resolution**: Port aus DI-Container auflösen

**Aktuelle Datei:** `src/infrastructure/adapters/foundry/versioning/portselector.ts`

---

## Aktuelle Verantwortlichkeiten

```typescript
export class PortSelector {
  // 1. Port-Auswahl
  selectPortFromTokens<T>(
    tokens: Map<number, InjectionToken<T>>,
    foundryVersion?: number,
    adapterName?: string
  ): Result<T, FoundryError>

  // 2. Version-Detection (inline)
  // getFoundryVersionResult() wird inline aufgerufen

  // 3. Event-Emission
  // eventEmitter.emit() wird inline aufgerufen

  // 4. Container-Resolution
  // container.resolveWithError() wird inline aufgerufen
}
```

**Probleme:**
- Port-Auswahl und Version-Detection sind vermischt
- Version-Detection-Logik ist bereits in `versiondetector.ts` vorhanden, wird aber inline verwendet
- Event-Emission ist bereits über Observer-Pattern gelöst (gut)
- Container-Resolution könnte besser abstrahiert sein

---

## Ziel-Architektur

### 1. PortSelector (Port-Auswahl)
**Verantwortlichkeit:** Nur Port-Auswahl basierend auf Version

```typescript
export class PortSelector {
  constructor(
    private readonly versionDetector: FoundryVersionDetector,
    private readonly eventEmitter: PortSelectionEventEmitter,
    private readonly container: ServiceContainer
  ) {}

  /**
   * Wählt kompatiblen Port aus und resolved ihn aus dem Container.
   */
  selectPortFromTokens<T>(
    tokens: Map<number, InjectionToken<T>>,
    foundryVersion?: number,
    adapterName?: string
  ): Result<T, FoundryError> {
    // 1. Version ermitteln (via VersionDetector)
    // 2. Kompatiblen Port auswählen
    // 3. Port aus Container auflösen
    // 4. Events emittieren
  }
}
```

### 2. FoundryVersionDetector (Version-Detection)
**Verantwortlichkeit:** Nur Version-Detection (bereits vorhanden, besser nutzen)

```typescript
// Bereits vorhanden: src/infrastructure/adapters/foundry/versioning/versiondetector.ts
// Sollte als Service injiziert werden statt inline verwendet zu werden

export class FoundryVersionDetector {
  /**
   * Ermittelt die aktuelle Foundry-Version.
   */
  getVersion(): Result<number, FoundryError> {
    return getFoundryVersionResult();
  }
}
```

### 3. PortResolutionStrategy (Container-Resolution)
**Verantwortlichkeit:** Nur Container-Resolution (optional)

```typescript
export class PortResolutionStrategy {
  constructor(private readonly container: ServiceContainer) {}

  resolve<T>(token: InjectionToken<T>): Result<T, FoundryError> {
    const result = this.container.resolveWithError(token);
    if (!result.ok) {
      return err(createFoundryError(
        "PORT_RESOLUTION_FAILED",
        `Failed to resolve port from container`,
        { token: String(token) },
        result.error
      ));
    }
    return ok(castResolvedService<T>(result.value));
  }
}
```

---

## Schritt-für-Schritt Migration

### Phase 1: FoundryVersionDetector als Service

1. **FoundryVersionDetector erstellen:**
   ```typescript
   // src/infrastructure/adapters/foundry/versioning/foundry-version-detector.ts
   export class FoundryVersionDetector {
     getVersion(): Result<number, FoundryError> {
       return getFoundryVersionResult();
     }
   }
   ```

2. **DI-Wrapper erstellen:**
   ```typescript
   export class DIFoundryVersionDetector extends FoundryVersionDetector {
     static dependencies = [] as const;

     constructor() {
       super();
     }
   }
   ```

3. **Token erstellen:**
   ```typescript
   // src/infrastructure/shared/tokens/foundry.tokens.ts
   export const foundryVersionDetectorToken: InjectionToken<FoundryVersionDetector> =
     createToken<FoundryVersionDetector>("foundryVersionDetector");
   ```

4. **In DI-Config registrieren:**
   ```typescript
   // src/framework/config/modules/port-infrastructure.config.ts
   container.registerClass(
     foundryVersionDetectorToken,
     DIFoundryVersionDetector,
     ServiceLifecycle.SINGLETON
   );
   ```

### Phase 2: PortResolutionStrategy extrahieren (optional)

1. **PortResolutionStrategy erstellen:**
   ```typescript
   // src/infrastructure/adapters/foundry/versioning/port-resolution-strategy.ts
   export class PortResolutionStrategy {
     constructor(private readonly container: ServiceContainer) {}

     resolve<T>(token: InjectionToken<T>): Result<T, FoundryError> {
       const result = this.container.resolveWithError(token);
       if (!result.ok) {
         return err(createFoundryError(
           "PORT_RESOLUTION_FAILED",
           `Failed to resolve port from container`,
           { token: String(token) },
           result.error
         ));
       }
       return ok(castResolvedService<T>(result.value));
     }
   }
   ```

2. **DI-Wrapper erstellen:**
   ```typescript
   export class DIPortResolutionStrategy extends PortResolutionStrategy {
     static dependencies = [serviceContainerToken] as const;

     constructor(container: ServiceContainer) {
       super(container);
     }
   }
   ```

### Phase 3: PortSelector refactoren

1. **Dependencies injizieren:**
   ```typescript
   export class PortSelector {
     private readonly resolutionStrategy: PortResolutionStrategy

     constructor(
       private readonly versionDetector: FoundryVersionDetector, // NEU
       private readonly eventEmitter: PortSelectionEventEmitter,
       observability: ObservabilityRegistry,
       container: ServiceContainer
     ) {
       observability.registerPortSelector(this);
       this.resolutionStrategy = new PortResolutionStrategy(container);
     }
   }
   ```

2. **selectPortFromTokens() refactoren:**
   ```typescript
   selectPortFromTokens<T>(
     tokens: Map<number, InjectionToken<T>>,
     foundryVersion?: number,
     adapterName?: string
   ): Result<T, FoundryError> {
     const startTime = performance.now();

     // 1. Version ermitteln (via VersionDetector)
     let version: number;
     if (foundryVersion !== undefined) {
       version = foundryVersion;
     } else {
       const versionResult = this.versionDetector.getVersion();
       if (!versionResult.ok) {
         return err(createFoundryError(
           "PORT_SELECTION_FAILED",
           "Could not determine Foundry version",
           undefined,
           versionResult.error
         ));
       }
       version = versionResult.value;
     }

     // 2. Kompatiblen Port auswählen
     const selectedToken = this.selectCompatibleToken(tokens, version);
     if (!selectedToken) {
       // Error handling...
     }

     // 3. Port aus Container auflösen (via ResolutionStrategy)
     const portResult = this.resolutionStrategy.resolve(selectedToken);
     if (!portResult.ok) {
       // Error handling...
     }

     // 4. Events emittieren
     const durationMs = performance.now() - startTime;
     this.eventEmitter.emit({
       type: "success",
       selectedVersion: selectedToken.version,
       foundryVersion: version,
       ...(adapterName !== undefined ? { adapterName } : {}),
       durationMs,
     });

     return ok(portResult.value);
   }

   private selectCompatibleToken<T>(
     tokens: Map<number, InjectionToken<T>>,
     version: number
   ): { token: InjectionToken<T>; version: number } | null {
     // Port-Auswahl-Logik
   }
   ```

### Phase 4: DI-Integration aktualisieren

1. **PortSelector Dependencies aktualisieren:**
   ```typescript
   export class DIPortSelector extends PortSelector {
     static dependencies = [
       foundryVersionDetectorToken, // NEU
       portSelectionEventEmitterToken,
       observabilityRegistryToken,
       serviceContainerToken,
     ] as const;

     constructor(
       versionDetector: FoundryVersionDetector,
       eventEmitter: PortSelectionEventEmitter,
       observability: ObservabilityRegistry,
       container: ServiceContainer
     ) {
       super(versionDetector, eventEmitter, observability, container);
     }
   }
   ```

---

## Breaking Changes

### API-Änderungen

1. **PortSelector:**
   - ✅ Keine öffentlichen API-Änderungen
   - ✅ Nur interne Refaktorierung

2. **Neue Abhängigkeiten:**
   - `PortSelector` benötigt `FoundryVersionDetector`

### Migration für externe Nutzer

**Keine Breaking Changes** - API bleibt stabil.

---

## Vorteile

1. ✅ **SRP-Konformität**: Jede Klasse hat eine einzige Verantwortlichkeit
2. ✅ **Bessere Testbarkeit**: Version-Detection isoliert testbar
3. ✅ **Wiederverwendbarkeit**: `FoundryVersionDetector` für andere Kontexte nutzbar
4. ✅ **Klarere Abhängigkeiten**: Explizite Dependencies
5. ✅ **Einfachere Wartung**: Änderungen an Version-Detection betreffen nur Detector

---

## Risiken

1. **Sehr Niedrig**: Nur interne Refaktorierung
2. **Sehr Niedrig**: Keine öffentlichen API-Änderungen
3. **Sehr Niedrig**: Tests müssen angepasst werden

---

## Erweiterte Möglichkeiten

### Custom Version-Detection-Strategien

```typescript
// Beispiel: Cached Version Detection
export class CachedVersionDetector extends FoundryVersionDetector {
  private cachedVersion: number | null = null;

  getVersion(): Result<number, FoundryError> {
    if (this.cachedVersion !== null) {
      return ok(this.cachedVersion);
    }
    const result = super.getVersion();
    if (result.ok) {
      this.cachedVersion = result.value;
    }
    return result;
  }
}
```

---

## Checkliste

- [ ] `FoundryVersionDetector` Klasse erstellen
- [ ] DI-Wrapper und Token erstellen
- [ ] In DI-Config registrieren
- [ ] `PortResolutionStrategy` erstellen (optional)
- [ ] `PortSelector` refactoren
- [ ] Version-Detection via `FoundryVersionDetector` verwenden
- [ ] Container-Resolution via `PortResolutionStrategy` verwenden
- [ ] Unit-Tests für `FoundryVersionDetector` schreiben
- [ ] Unit-Tests für `PortSelector` aktualisieren
- [ ] Integration-Tests aktualisieren
- [ ] CHANGELOG.md aktualisieren

---

## Referenzen

- **Aktuelle Implementierung:** `src/infrastructure/adapters/foundry/versioning/portselector.ts`
- **Version Detector:** `src/infrastructure/adapters/foundry/versioning/versiondetector.ts`
- **Port Selection Events:** `src/infrastructure/adapters/foundry/versioning/port-selection-events.ts`
- **ServiceContainer:** `src/infrastructure/di/container.ts`

