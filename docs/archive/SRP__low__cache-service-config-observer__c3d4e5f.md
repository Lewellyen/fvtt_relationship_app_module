---
principle: SRP
severity: low
confidence: medium
component_kind: class
component_name: CacheService
file: "src/infrastructure/cache/CacheService.ts"
location:
  start_line: 40
  end_line: 303
tags: ["srp", "observer", "config", "responsibility"]
---

# Problem

Die Klasse `CacheService` implementiert sowohl das `CacheServiceContract` als auch `CacheConfigObserver`. Dies kombiniert zwei Verantwortlichkeiten:

1. **Cache-Operationen**: Get, Set, Delete, Clear, Invalidate
2. **Config-Reaktion**: Reagieren auf Konfigurationsänderungen

Während dies funktional korrekt ist, könnte es als SRP-Verstoß betrachtet werden, da die Klasse sowohl Cache-Operationen als auch Config-Management übernimmt.

## Evidence

```40:40:src/infrastructure/cache/CacheService.ts
export class CacheService implements CacheServiceContract, CacheConfigObserver {
```

```293:303:src/infrastructure/cache/CacheService.ts
  /**
   * Called when cache configuration is updated.
   * Implements CacheConfigObserver to react to configuration changes.
   *
   * @param config - The updated cache configuration
   */
  public onConfigUpdated(config: CacheServiceConfig): void {
    if (!config.enabled) {
      this.clearStore();
      return;
    }

    const currentConfig = this.configManager.getConfig();
    if (typeof config.maxEntries === "number" && config.maxEntries !== currentConfig.maxEntries) {
      this.enforceCapacity();
    }
  }
```

**Kontext:**
- `CacheService` ist der Hauptservice für Cache-Operationen
- `CacheConfigObserver` wird verwendet, um auf Runtime-Konfigurationsänderungen zu reagieren
- Die Implementierung ist relativ einfach (nur 10 Zeilen)

**Betroffene Dateien:**
- `src/infrastructure/cache/CacheService.ts`
- `src/infrastructure/cache/cache-config-observer.interface.ts`

## SOLID-Analyse

**SRP-Verstoß (niedrig):**
- SRP besagt: "Eine Klasse sollte nur einen Grund zur Änderung haben"
- `CacheService` hat zwei Gründe zur Änderung:
  1. Cache-Operationen ändern sich
  2. Config-Reaktionslogik ändert sich

**Warum niedrige Severity:**
- Die `onConfigUpdated()`-Methode ist sehr einfach (nur 10 Zeilen)
- Die Logik ist eng mit Cache-Operationen verbunden
- Trennung würde zusätzliche Komplexität einführen

**Nebenwirkungen:**
- **Testbarkeit**: Config-Reaktion muss mit Cache-Operationen getestet werden
- **Kohäsion**: Zwei verschiedene Verantwortlichkeiten in einer Klasse

## Zielbild

**Option A: Separate Config Handler (nicht empfohlen für diesen Fall)**
```typescript
class CacheConfigHandler implements CacheConfigObserver {
  constructor(private readonly cacheService: CacheServiceContract) {}

  onConfigUpdated(config: CacheServiceConfig): void {
    if (!config.enabled) {
      this.cacheService.clear();
      return;
    }
    // ... weitere Logik
  }
}
```

**Option B: Behalten (empfohlen)**
- Die aktuelle Implementierung ist akzeptabel
- Die Config-Reaktion ist eng mit Cache-Operationen verbunden
- Trennung würde mehr Komplexität als Nutzen bringen

## Lösungsvorschlag

### Approach A: Behalten (empfohlen)

**Begründung:**
- Die `onConfigUpdated()`-Methode ist sehr einfach
- Die Logik ist eng mit Cache-Operationen verbunden
- Trennung würde zusätzliche Komplexität einführen ohne klaren Nutzen
- Die Methode nutzt bereits vorhandene Methoden (`clearStore()`, `enforceCapacity()`)

**Vorteile:**
- Einfach
- Keine zusätzliche Komplexität
- Direkter Zugriff auf interne Methoden

**Nachteile:**
- Leichter SRP-Verstoß (aber akzeptabel)

### Approach B: Separate Handler (optional)

1. **CacheConfigHandler erstellen**: Separate Klasse für Config-Reaktionen
2. **Delegation**: Handler delegiert an CacheService-Methoden

**Vorteile:**
- Klare Trennung der Verantwortlichkeiten
- Handler kann isoliert getestet werden

**Nachteile:**
- Zusätzliche Komplexität
- Handler muss öffentliche API von CacheService nutzen
- Möglicherweise weniger effizient (Methodenaufrufe)

## Refactoring-Schritte

**Nur wenn Approach B gewählt wird:**

1. **CacheConfigHandler erstellen**:
   ```typescript
   // src/infrastructure/cache/config/CacheConfigHandler.ts
   export class CacheConfigHandler implements CacheConfigObserver {
     constructor(private readonly cacheService: CacheServiceContract) {}

     onConfigUpdated(config: CacheServiceConfig): void {
       if (!config.enabled) {
         this.cacheService.clear();
         return;
       }

       // Weitere Logik...
     }
   }
   ```

2. **CacheService anpassen**:
   ```typescript
   export class CacheService implements CacheServiceContract {
     // onConfigUpdated entfernen
     // Handler wird extern registriert
   }
   ```

3. **Handler registrieren**:
   ```typescript
   // In dependencyconfig.ts
   const cacheService = container.resolve(cacheServiceToken);
   const configHandler = new CacheConfigHandler(cacheService);
   cacheConfigSync.registerObserver(configHandler);
   ```

**Breaking Changes:**
- `CacheService` implementiert `CacheConfigObserver` nicht mehr
- Handler muss separat registriert werden

## Beispiel-Code

**Aktuell (akzeptabel):**
```typescript
export class CacheService implements CacheServiceContract, CacheConfigObserver {
  public onConfigUpdated(config: CacheServiceConfig): void {
    if (!config.enabled) {
      this.clearStore();
      return;
    }
    // ...
  }
}
```

**Alternative (wenn gewünscht):**
```typescript
export class CacheService implements CacheServiceContract {
  // onConfigUpdated entfernt
}

export class CacheConfigHandler implements CacheConfigObserver {
  constructor(private readonly cache: CacheServiceContract) {}

  onConfigUpdated(config: CacheServiceConfig): void {
    if (!config.enabled) {
      this.cache.clear();
      return;
    }
    // ...
  }
}
```

## Tests & Quality Gates

**Aktuelle Tests:**
- Config-Update-Tests sind Teil der CacheService-Tests
- Funktioniert gut, da alles in einer Klasse

**Wenn refactored:**
- Separate Tests für CacheConfigHandler
- Integration-Tests für Handler + CacheService

**Quality Gates:**
- `npm run type-check` muss bestehen
- `npm run test:coverage` muss bestehen

## Akzeptanzkriterien

**Wenn Approach A (Behalten):**
1. ✅ Dokumentation aktualisiert (warum SRP-Verstoß akzeptabel ist)
2. ✅ Code-Kommentare erklären die Design-Entscheidung

**Wenn Approach B (Trennen):**
1. ✅ CacheConfigHandler erstellt
2. ✅ CacheService implementiert CacheConfigObserver nicht mehr
3. ✅ Handler wird korrekt registriert
4. ✅ Alle Tests bestehen

## Notes

- **Warum niedrige Severity?**: Die Config-Reaktion ist sehr einfach und eng mit Cache-Operationen verbunden
- **Pragmatischer Ansatz**: Manchmal ist eine leichte SRP-Verletzung akzeptabel, wenn die Alternative mehr Komplexität einführt
- **Zukünftige Überlegungen**: Wenn die Config-Reaktionslogik komplexer wird, sollte Trennung in Betracht gezogen werden
- **Empfehlung**: Behalten, aber dokumentieren warum

