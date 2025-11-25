# DIP-Refactoring Plan 5: MetricsStorage direkte Instantiierung

**Datum:** 2025-01-27  
**Betroffene Komponenten:** `core-services.config.ts`, `LocalStorageMetricsStorage`  
**Ziel:** Entkopplung der DI-Konfiguration von konkreter Storage-Implementierung durch Factory-Function  
**Priorität:** 🟢 Niedrig (Nice-to-Have)

---

## Problembeschreibung

### DIP-Verletzung

Die DI-Konfiguration in `core-services.config.ts` instanziiert direkt die konkrete `LocalStorageMetricsStorage`-Klasse:

**Aktuelle Situation:**

```typescript
// src/framework/config/modules/core-services.config.ts (Zeile 62)

import { LocalStorageMetricsStorage } from "@/infrastructure/observability/metrics-persistence/local-storage-metrics-storage";

export function registerCoreServices(container: ServiceContainer): Result<void, string> {
  // ...
  
  const metricsKey = runtimeConfig.get("metricsPersistenceKey") ?? "fvtt_relationship_app_module.metrics";
  const storageInstance = new LocalStorageMetricsStorage(metricsKey);  // ❌ Direkte Instantiierung
  const storageResult = container.registerValue(metricsStorageToken, storageInstance);
  
  // ...
}
```

**Probleme:**
- ❌ **High-Level Modul** (Config) hängt von **Low-Level Implementierung** (LocalStorageMetricsStorage) ab
- ❌ Configuration-Layer kennt konkrete Infrastructure-Details
- ❌ Erschwert zukünftige Erweiterungen (z.B. IndexedDB, Server-basiert)
- ✅ **Aber:** `MetricsStorage` Interface existiert bereits!

### Warum ist das problematisch?

1. **Tight Coupling:** Config-Module sollte nur Interfaces kennen, nicht konkrete Implementierungen
2. **Erweiterbarkeit:** Neue Storage-Backends erfordern Änderung im Config-Modul
3. **Testbarkeit:** Config-Module schwerer zu testen mit konkreten Implementierungen

---

## Ziel-Architektur

### Factory-Function-Pattern

```
core-services.config.ts (High-Level)
    ↓ ruft auf
createMetricsStorage(key) (Factory)
    ↓ erstellt
LocalStorageMetricsStorage (Low-Level)
```

**Prinzip:** High-Level Module kennt nur Factory-Function und Interface, nicht die konkrete Implementierung.

---

## Schritt-für-Schritt Refactoring

### Phase 1: Factory-Function erstellen

#### 1.1 Factory-Function implementieren

**Datei:** `src/infrastructure/observability/metrics-persistence/metrics-storage-factory.ts` (neu)

```typescript
import type { MetricsPersistenceState } from "@/infrastructure/observability/metrics-collector";
import type { MetricsStorage } from "./metrics-storage";
import { LocalStorageMetricsStorage } from "./local-storage-metrics-storage";

/**
 * Factory function for creating MetricsStorage instances.
 *
 * Abstracts the concrete implementation from the DI configuration.
 * This allows easy swapping of storage backends without changing the config.
 *
 * @param key - Storage key for persisting metrics
 * @returns MetricsStorage instance
 */
export function createMetricsStorage(key: string): MetricsStorage {
  return new LocalStorageMetricsStorage(key);
}

/**
 * Creates an in-memory MetricsStorage for testing without touching browser APIs.
 */
export function createInMemoryMetricsStorage(): MetricsStorage {
  let state: MetricsPersistenceState | null = null;

  return {
    load(): MetricsPersistenceState | null {
      return state;
    },
    save(newState: MetricsPersistenceState): void {
      state = newState;
    },
    clear(): void {
      state = null;
    },
  };
}
```

**Vorteile:**
- ✅ Factory-Function kennt konkrete Implementierung
- ✅ Config-Module kennt nur Factory und Interface
- ✅ Einfach erweiterbar für neue Backends
- ✅ Testbar (InMemory-Factory für Tests)

---

### Phase 2: Config-Module refactoren

#### 2.1 Import ändern

**Datei:** `src/framework/config/modules/core-services.config.ts`

**Vorher:**
```typescript
import { LocalStorageMetricsStorage } from "@/infrastructure/observability/metrics-persistence/local-storage-metrics-storage";
```

**Nachher:**
```typescript
import { createMetricsStorage } from "@/infrastructure/observability/metrics-persistence/metrics-storage-factory";
```

#### 2.2 Instantiierung ändern

**Vorher:**
```typescript
const metricsKey = runtimeConfig.get("metricsPersistenceKey") ?? "fvtt_relationship_app_module.metrics";
const storageInstance = new LocalStorageMetricsStorage(metricsKey);  // ❌
const storageResult = container.registerValue(metricsStorageToken, storageInstance);
```

**Nachher:**
```typescript
const metricsKey = runtimeConfig.get("metricsPersistenceKey") ?? "fvtt_relationship_app_module.metrics";
const storageInstance = createMetricsStorage(metricsKey);  // ✅ Factory
const storageResult = container.registerValue(metricsStorageToken, storageInstance);
```

---

### Phase 3: Tests anpassen

#### 3.1 Test-Setup mit Factory

```typescript
// Tests die MetricsStorage benötigen
import { createInMemoryMetricsStorage } from "@/infrastructure/observability/metrics-persistence/metrics-storage-factory";

describe("PersistentMetricsCollector", () => {
  it("should persist metrics", () => {
    const storage = createInMemoryMetricsStorage();  // ✅ Factory für Tests
    const collector = new PersistentMetricsCollector(runtimeConfig, storage);
    // ... test logic ...
  });
});
```

#### 3.2 Coverage-Status (2025-11-25)

- `metrics-storage-factory.test.ts` prüft sowohl `createMetricsStorage()` (LocalStorage-Instanzierung) als auch `createInMemoryMetricsStorage()` (Load/Save/Clear + Instanz-Isolation).
- Die Tests stellen sicher, dass keine Browser-APIs benötigt werden und die globale Coverage-Anforderung von 100 % eingehalten wird.
- Factory-Pfade sind damit vollständig messbar und Teil der automatischen Regressionstests.

---

### Phase 4: Erweiterbarkeit demonstrieren (Optional)

#### 4.1 Neue Storage-Backends hinzufügen

**Beispiel: IndexedDB Storage**

```typescript
// src/infrastructure/observability/metrics-persistence/indexed-db-metrics-storage.ts
export class IndexedDBMetricsStorage implements MetricsStorage {
  constructor(private readonly dbName: string) {}
  
  load(): MetricsPersistenceState | null {
    // IndexedDB implementation
  }
  
  save(state: MetricsPersistenceState): void {
    // IndexedDB implementation
  }
}
```

**Factory erweitern:**

```typescript
// metrics-storage-factory.ts
export function createMetricsStorage(key: string, backend: "localStorage" | "indexedDB" = "localStorage"): MetricsStorage {
  switch (backend) {
    case "localStorage":
      return new LocalStorageMetricsStorage(key);
    case "indexedDB":
      return new IndexedDBMetricsStorage(key);
    default:
      throw new Error(`Unknown storage backend: ${backend}`);
  }
}
```

**Config nutzt:**

```typescript
const backend = runtimeConfig.get("metricsStorageBackend") ?? "localStorage";
const storageInstance = createMetricsStorage(metricsKey, backend);  // ✅ Konfigurierbar
```

**Kein Breaking Change** in Config-Module!

---

## Alternative Lösung: DI-Factory statt Value-Registration

### Option 2: Container registerFactory statt registerValue

**Datei:** `src/framework/config/modules/core-services.config.ts`

**Statt:**
```typescript
const storageInstance = createMetricsStorage(metricsKey);
container.registerValue(metricsStorageToken, storageInstance);
```

**Nutze:**
```typescript
container.registerFactory(
  metricsStorageToken,
  (deps) => {
    const config = deps.get(runtimeConfigToken);
    const key = config.get("metricsPersistenceKey") ?? "fvtt_relationship_app_module.metrics";
    return createMetricsStorage(key);  // ✅ Factory-Function
  },
  ServiceLifecycle.SINGLETON
);
```

**Vorteile:**
- ✅ Lazy Instantiation (nur wenn benötigt)
- ✅ RuntimeConfig automatisch via DI aufgelöst
- ✅ Konsistenter mit anderen Registrierungen

**Nachteile:**
- ⚠️ Etwas komplexer (aber flexibler)

---

## Migration-Pfad

### Schritt 1: Factory-Function erstellen (keine Breaking Changes)
- ✅ `metrics-storage-factory.ts` erstellen
- ✅ `createMetricsStorage()` und `createInMemoryMetricsStorage()` implementieren
- ✅ Export aus Index-File

### Schritt 2: Config-Module anpassen
- ✅ Import ändern (von `LocalStorageMetricsStorage` zu `createMetricsStorage`)
- ✅ Instantiierung ändern (von `new` zu Factory-Call)
- ✅ Tests validieren

### Schritt 3: Tests anpassen (Optional)
- ✅ Test-Setup nutzt `createInMemoryMetricsStorage()`
- ✅ Reduziert Test-Boilerplate

### Schritt 4: Cleanup
- ✅ Sicherstellen, dass `LocalStorageMetricsStorage` nur noch in Factory importiert wird
- ✅ Dokumentation aktualisieren

---

## Breaking Changes

### ⚠️ Keine Breaking Changes

- ✅ Öffentliche API bleibt unverändert
- ✅ `MetricsStorage` Interface bleibt gleich
- ✅ `PersistentMetricsCollector` sieht keine Änderung
- ✅ Tests können optional angepasst werden

---

## Vorteile nach Refactoring

### ✅ DIP-Konformität

- ✅ High-Level Config kennt nur Interface und Factory
- ✅ Konkrete Implementierung ist abstrahiert
- ✅ Single Responsibility: Factory verantwortlich für Instantiierung

### ✅ Erweiterbarkeit

- ✅ Neue Storage-Backends ohne Config-Änderung
- ✅ Backend-Wahl zur Laufzeit konfigurierbar
- ✅ Einfach zu testen (InMemory-Factory)

### ✅ Wartbarkeit

- ✅ Klare Trennung: Config vs. Implementierung
- ✅ Änderungen an Storage-Implementierung lokal
- ✅ Factory ist Single Point of Instantiation

### ✅ Testbarkeit

- ✅ Tests nutzen InMemory-Storage ohne Browser-API
- ✅ Reduziert Boilerplate in Tests
- ✅ Isolation von Storage-Implementierung

## Testabdeckung

- **Status 2025-11-25:** Alle Factory-Pfade sind durch `metrics-storage-factory.test.ts` abgedeckt (LocalStorage-Instantiierung, in-memory Persistenz, Clear-Pfade und Instanz-Isolation).
- **Ziel:** Sicherstellen, dass zukünftige Erweiterungen (weitere Backends) unmittelbar eigene Tests erhalten, damit die globale Coverage-Hürde (100 %) stabil bleibt.
- **Monitoring:** Coverage-Reports aus `npm run test:coverage` prüfen explizit die Datei `metrics-storage-factory.ts`, weil sie früher 0 % aufwies.

---

## Code-Beispiel: Vollständige Factory

```typescript
// src/infrastructure/observability/metrics-persistence/metrics-storage-factory.ts

import type { MetricsStorage } from "./metrics-storage";
import { LocalStorageMetricsStorage } from "./local-storage-metrics-storage";

/**
 * Storage backend types supported by the factory.
 */
export type MetricsStorageBackend = "localStorage" | "memory";

/**
 * Options for creating a MetricsStorage instance.
 */
export interface MetricsStorageOptions {
  /** Storage key for persisting metrics */
  key: string;
  /** Storage backend to use (default: "localStorage") */
  backend?: MetricsStorageBackend;
}

/**
 * Creates a MetricsStorage instance based on configuration.
 * 
 * This factory abstracts the concrete storage implementation from the caller,
 * allowing easy switching between backends and improved testability.
 * 
 * @param options - Storage configuration options
 * @returns MetricsStorage instance
 * 
 * @example
 * ```typescript
 * // Production: Use localStorage
 * const storage = createMetricsStorage({ key: "my-app.metrics" });
 * 
 * // Testing: Use in-memory storage
 * const storage = createMetricsStorage({ key: "test", backend: "memory" });
 * ```
 */
export function createMetricsStorage(options: MetricsStorageOptions): MetricsStorage {
  const { key, backend = "localStorage" } = options;

  switch (backend) {
    case "localStorage":
      return new LocalStorageMetricsStorage(key);
    
    case "memory":
      // In-memory implementation for testing
      return createInMemoryMetricsStorage();
    
    default: {
      // Exhaustive check with type narrowing
      const _exhaustive: never = backend;
      throw new Error(`Unknown storage backend: ${_exhaustive}`);
    }
  }
}

/**
 * Creates an in-memory MetricsStorage for testing.
 * Data is not persisted and is lost when the instance is garbage collected.
 * 
 * @returns MetricsStorage instance
 */
export function createInMemoryMetricsStorage(): MetricsStorage {
  let state: MetricsPersistenceState | null = null;

  return {
    load(): MetricsPersistenceState | null {
      return state;
    },
    save(newState: MetricsPersistenceState): void {
      state = newState;
    },
    clear(): void {
      state = null;
    },
  };
}

/**
 * Convenience function for creating storage with just a key.
 * Uses default localStorage backend.
 * 
 * @param key - Storage key
 * @returns MetricsStorage instance
 */
export function createDefaultMetricsStorage(key: string): MetricsStorage {
  return createMetricsStorage({ key });
}
```

---

## Verwendung in Config

```typescript
// src/framework/config/modules/core-services.config.ts

import { createDefaultMetricsStorage } from "@/infrastructure/observability/metrics-persistence/metrics-storage-factory";

export function registerCoreServices(container: ServiceContainer): Result<void, string> {
  const runtimeConfig = container.getRegisteredValue(runtimeConfigToken);
  if (!runtimeConfig) {
    return err("RuntimeConfigService not registered");
  }
  const enablePersistence = runtimeConfig.get("enableMetricsPersistence") === true;

  if (enablePersistence) {
    const metricsKey = runtimeConfig.get("metricsPersistenceKey") ?? "fvtt_relationship_app_module.metrics";
    
    // ✅ Factory-Function statt direkter new
    const storageInstance = createDefaultMetricsStorage(metricsKey);
    
    const storageResult = container.registerValue(metricsStorageToken, storageInstance);
    if (isErr(storageResult)) {
      return err(`Failed to register MetricsStorage: ${storageResult.error.message}`);
    }

    const persistentResult = container.registerClass(
      metricsCollectorToken,
      DIPersistentMetricsCollector,
      ServiceLifecycle.SINGLETON
    );
    if (isErr(persistentResult)) {
      return err(`Failed to register PersistentMetricsCollector: ${persistentResult.error.message}`);
    }
  } else {
    // ... non-persistent collector ...
  }

  return ok(undefined);
}
```

---

## Tests

```typescript
// src/infrastructure/observability/metrics-persistence/__tests__/metrics-storage-factory.test.ts

import { describe, it, expect } from "vitest";
import { createMetricsStorage, createInMemoryMetricsStorage } from "../metrics-storage-factory";

describe("createMetricsStorage", () => {
  it("should create localStorage backend by default", () => {
    const storage = createMetricsStorage({ key: "test" });
    expect(storage).toBeDefined();
    // LocalStorage is default, so saving should work
    storage.save({ resolutionMetrics: { totalResolutions: 1 } });
  });

  it("should create in-memory backend when specified", () => {
    const storage = createMetricsStorage({ key: "test", backend: "memory" });
    
    // Should start with null state
    expect(storage.load()).toBeNull();
    
    // Should persist in memory
    const state = { resolutionMetrics: { totalResolutions: 42 } };
    storage.save(state);
    expect(storage.load()).toEqual(state);
  });
});

describe("createInMemoryMetricsStorage", () => {
  it("should not persist data across instances", () => {
    const storage1 = createInMemoryMetricsStorage();
    storage1.save({ resolutionMetrics: { totalResolutions: 10 } });
    
    const storage2 = createInMemoryMetricsStorage();
    expect(storage2.load()).toBeNull();  // ✅ Isolated
  });

  it("should support clear operation", () => {
    const storage = createInMemoryMetricsStorage();
    storage.save({ resolutionMetrics: { totalResolutions: 5 } });
    expect(storage.load()).not.toBeNull();
    
    storage.clear?.();
    expect(storage.load()).toBeNull();
  });
});
```

---

## Offene Fragen / Follow-ups

1. **InMemory-Implementierung:**  
   Soll `InMemoryMetricsStorage` als eigene Klasse implementiert werden, oder reicht die inline-Factory?

2. **Backend-Konfiguration:**  
   Soll Storage-Backend über RuntimeConfig wählbar sein, oder ist localStorage ausreichend?

3. **IndexedDB-Support:**  
   Ist IndexedDB als Alternative zu localStorage gewünscht?

---

## Schätzung

- **Aufwand:** ~30 Minuten
- **Komplexität:** Niedrig
- **Risiko:** Sehr niedrig (additive Änderung)
- **Breaking Changes:** Keine

---

## Priorität

**Empfehlung:** 🟢 **Niedrig** (Nice-to-Have)

**Begründung:**
- Klein und schnell umsetzbar
- Verbessert Architektur marginal
- Andere Refactorings (Plan 2, 3, 4) sind wichtiger
- Kann jederzeit nachgezogen werden

