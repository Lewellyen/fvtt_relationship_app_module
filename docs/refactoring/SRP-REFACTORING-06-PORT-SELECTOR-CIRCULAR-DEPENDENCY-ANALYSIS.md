# Zirkuläre Abhängigkeiten Analyse: PortSelector Refactoring

**Erstellt:** 2025-01-XX
**Status:** ✅ Keine zirkulären Abhängigkeiten erkannt
**Refactoring-Plan:** `docs/refactoring/SRP-REFACTORING-06-PORT-SELECTOR.md`

---

## Zusammenfassung

**Ergebnis:** ✅ **Keine zirkulären Abhängigkeiten** durch das geplante Refactoring.

Das Refactoring ist sicher und kann ohne Risiko für zirkuläre Abhängigkeiten durchgeführt werden.

---

## Aktuelle Abhängigkeitsstruktur

### PortSelector (vor Refactoring)

```typescript
PortSelector
├── PortSelectionEventEmitter (TRANSIENT)
├── ObservabilityRegistry (SINGLETON)
└── ServiceContainer (SINGLETON)

Verwendet:
├── getFoundryVersionResult() [statische Funktion]
└── container.resolveWithError() [direkt auf Container]
```

**Dependencies:**
- `portSelectionEventEmitterToken` (TRANSIENT)
- `observabilityRegistryToken` (SINGLETON)
- `serviceContainerToken` (SINGLETON)

**Verwendet von:**
- `FoundryGamePort`
- `FoundryHooksPort`
- `FoundryDocumentPort`
- `FoundryUIPort`
- `FoundrySettingsPort`
- `FoundryI18nPort`

---

## Geplante Abhängigkeitsstruktur

### 1. FoundryVersionDetector (NEU)

```typescript
FoundryVersionDetector
└── KEINE Dependencies

Methoden:
└── getVersion(): Result<number, FoundryError>
    └── Ruft getFoundryVersionResult() auf (statische Funktion)
```

**Dependencies:** `[]` (keine)

**Verwendet von:**
- `PortSelector` (nach Refactoring)

**Zirkularitätsprüfung:**
- ✅ `FoundryVersionDetector` hat keine Dependencies
- ✅ `FoundryVersionDetector` verwendet nicht `PortSelector`
- ✅ Keine Rückwärts-Abhängigkeit möglich

---

### 2. PortResolutionStrategy (OPTIONAL, NEU)

```typescript
PortResolutionStrategy
└── ServiceContainer (SINGLETON)

Methoden:
└── resolve<T>(token: InjectionToken<T>): Result<T, FoundryError>
    └── Ruft container.resolveWithError() auf
```

**Dependencies:**
- `serviceContainerToken` (SINGLETON)

**Verwendet von:**
- `PortSelector` (nach Refactoring, optional)

**Zirkularitätsprüfung:**
- ✅ `PortResolutionStrategy` braucht nur `ServiceContainer`
- ✅ `PortResolutionStrategy` verwendet nicht `PortSelector`
- ✅ `ServiceContainer` ist bereits vorhanden (wird nicht von `PortSelector` erstellt)
- ✅ Keine Rückwärts-Abhängigkeit möglich

---

### 3. PortSelector (nach Refactoring)

**Option A: PortResolutionStrategy im Constructor erstellt**

```typescript
PortSelector
├── FoundryVersionDetector (SINGLETON) [NEU]
├── PortSelectionEventEmitter (TRANSIENT)
├── ObservabilityRegistry (SINGLETON)
└── ServiceContainer (SINGLETON)
    └── PortResolutionStrategy (wird im Constructor erstellt)
```

**Dependencies:**
- `foundryVersionDetectorToken` (SINGLETON) [NEU]
- `portSelectionEventEmitterToken` (TRANSIENT)
- `observabilityRegistryToken` (SINGLETON)
- `serviceContainerToken` (SINGLETON)

**Zirkularitätsprüfung:**
- ✅ `PortSelector` → `FoundryVersionDetector`: Keine Zirkularität (Detector hat keine Dependencies)
- ✅ `PortSelector` → `PortResolutionStrategy`: Keine Zirkularität (Strategy braucht nur Container)
- ✅ `PortSelector` → `ServiceContainer`: Bereits vorhanden, keine Änderung
- ✅ Keine Rückwärts-Abhängigkeiten

**Option B: PortResolutionStrategy als Dependency injiziert**

```typescript
PortSelector
├── FoundryVersionDetector (SINGLETON) [NEU]
├── PortResolutionStrategy (SINGLETON) [NEU]
├── PortSelectionEventEmitter (TRANSIENT)
└── ObservabilityRegistry (SINGLETON)
```

**Dependencies:**
- `foundryVersionDetectorToken` (SINGLETON) [NEU]
- `portResolutionStrategyToken` (SINGLETON) [NEU]
- `portSelectionEventEmitterToken` (TRANSIENT)
- `observabilityRegistryToken` (SINGLETON)

**Zirkularitätsprüfung:**
- ✅ `PortSelector` → `FoundryVersionDetector`: Keine Zirkularität
- ✅ `PortSelector` → `PortResolutionStrategy`: Keine Zirkularität (Strategy braucht nur Container)
- ✅ Keine Rückwärts-Abhängigkeiten

---

## Abhängigkeitsgraph

### Vor Refactoring

```
PortSelector
  ├── PortSelectionEventEmitter
  ├── ObservabilityRegistry
  └── ServiceContainer
      └── [verwendet getFoundryVersionResult() direkt]
```

### Nach Refactoring (Option A)

```
PortSelector
  ├── FoundryVersionDetector (keine Dependencies)
  ├── PortSelectionEventEmitter
  ├── ObservabilityRegistry
  └── ServiceContainer
      └── PortResolutionStrategy (erstellt im Constructor)
          └── ServiceContainer (bereits vorhanden)
```

### Nach Refactoring (Option B)

```
PortSelector
  ├── FoundryVersionDetector (keine Dependencies)
  ├── PortResolutionStrategy
  │   └── ServiceContainer
  ├── PortSelectionEventEmitter
  └── ObservabilityRegistry
```

**Keine Zyklen erkennbar!** ✅

---

## Registrierungsreihenfolge

### Aktuelle Reihenfolge (aus `dependencyconfig.ts`)

```typescript
1. registerStaticValues()          // ENV, etc.
2. registerCoreServices()          // Logger, Metrics, etc.
3. registerObservability()         // EventEmitter, ObservabilityRegistry
4. registerUtilityServices()       // Performance, Retry
5. registerCacheServices()        // Cache
6. registerPortInfrastructure()   // PortSelector ← HIER
7. registerSubcontainerValues()    // Port Registries
8. registerFoundryServices()      // FoundryGamePort, etc. (verwenden PortSelector)
```

### Nach Refactoring (Option A)

```typescript
1. registerStaticValues()
2. registerCoreServices()
3. registerObservability()
4. registerUtilityServices()
5. registerCacheServices()
6. registerPortInfrastructure()
   ├── FoundryVersionDetector registrieren  [NEU, vor PortSelector]
   └── PortSelector registrieren
       └── PortResolutionStrategy wird im Constructor erstellt
7. registerSubcontainerValues()
8. registerFoundryServices()
```

### Nach Refactoring (Option B)

```typescript
1. registerStaticValues()
2. registerCoreServices()
3. registerObservability()
4. registerUtilityServices()
5. registerCacheServices()
6. registerPortInfrastructure()
   ├── FoundryVersionDetector registrieren  [NEU]
   ├── PortResolutionStrategy registrieren  [NEU]
   └── PortSelector registrieren
7. registerSubcontainerValues()
8. registerFoundryServices()
```

**Reihenfolge ist korrekt:** Alle Dependencies von `PortSelector` werden vor `PortSelector` registriert. ✅

---

## Detaillierte Zirkularitätsprüfung

### 1. PortSelector → FoundryVersionDetector

**Prüfung:**
- `PortSelector` benötigt `FoundryVersionDetector` ✅
- `FoundryVersionDetector` benötigt keine Dependencies ✅
- `FoundryVersionDetector` verwendet nicht `PortSelector` ✅

**Ergebnis:** ✅ Keine Zirkularität

---

### 2. PortSelector → PortResolutionStrategy

**Prüfung:**
- `PortSelector` benötigt `PortResolutionStrategy` (optional) ✅
- `PortResolutionStrategy` benötigt nur `ServiceContainer` ✅
- `PortResolutionStrategy` verwendet nicht `PortSelector` ✅
- `ServiceContainer` ist bereits vorhanden (wird nicht von `PortSelector` erstellt) ✅

**Ergebnis:** ✅ Keine Zirkularität

---

### 3. PortSelector → ServiceContainer

**Prüfung:**
- `PortSelector` benötigt `ServiceContainer` (bereits vorhanden) ✅
- `ServiceContainer` erstellt `PortSelector` (keine Rückwärts-Abhängigkeit) ✅

**Ergebnis:** ✅ Keine Zirkularität (Container ist Root-Objekt)

---

### 4. FoundryVersionDetector → PortSelector

**Prüfung:**
- `FoundryVersionDetector` hat keine Dependencies ✅
- `FoundryVersionDetector` verwendet nicht `PortSelector` ✅

**Ergebnis:** ✅ Keine Zirkularität

---

### 5. PortResolutionStrategy → PortSelector

**Prüfung:**
- `PortResolutionStrategy` benötigt nur `ServiceContainer` ✅
- `PortResolutionStrategy` verwendet nicht `PortSelector` ✅

**Ergebnis:** ✅ Keine Zirkularität

---

## Potenzielle Risiken

### ⚠️ Risiko 1: PortResolutionStrategy im Constructor

**Problem:** Wenn `PortResolutionStrategy` im Constructor von `PortSelector` erstellt wird, könnte es zu Problemen kommen, wenn `ServiceContainer` noch nicht vollständig initialisiert ist.

**Lösung:**
- `ServiceContainer` ist bereits vorhanden (wird vor `PortSelector` erstellt)
- `PortResolutionStrategy` benötigt nur `ServiceContainer`, keine anderen Services
- ✅ Kein Risiko

**Alternative:** `PortResolutionStrategy` als Dependency injizieren (Option B)

---

### ⚠️ Risiko 2: FoundryVersionDetector könnte zukünftig PortSelector benötigen

**Problem:** Wenn `FoundryVersionDetector` in Zukunft `PortSelector` benötigt, entsteht eine Zirkularität.

**Lösung:**
- `FoundryVersionDetector` ist eine reine Utility-Klasse ohne Dependencies
- Sollte keine Business-Logik enthalten, die `PortSelector` benötigt
- ✅ Sehr unwahrscheinlich

**Prävention:** `FoundryVersionDetector` sollte nur Version-Detection machen, keine Port-Auswahl.

---

### ⚠️ Risiko 3: PortResolutionStrategy könnte zukünftig PortSelector benötigen

**Problem:** Wenn `PortResolutionStrategy` in Zukunft `PortSelector` benötigt, entsteht eine Zirkularität.

**Lösung:**
- `PortResolutionStrategy` ist eine reine Resolution-Utility
- Sollte nur Container-Resolution machen, keine Port-Auswahl
- ✅ Sehr unwahrscheinlich

**Prävention:** `PortResolutionStrategy` sollte nur Container-Resolution machen, keine Port-Auswahl.

---

## Vergleich mit bestehenden Zirkularitäts-Lösungen

Das Projekt hat bereits Erfahrung mit zirkulären Abhängigkeiten (siehe `docs/archive/CIRCULAR-DEPENDENCY-SOLUTIONS.md`):

**Bekannte Lösungsansätze:**
1. Dependency Resolution Interface (für ServiceResolver)
2. Service Instantiation Interface
3. Callback/Function Injection
4. Lazy Initialization
5. Dependency Injection Container Pattern

**Für PortSelector Refactoring:**
- ✅ Keine dieser Lösungen nötig
- ✅ Klare, unidirektionale Abhängigkeiten
- ✅ Keine Zirkularität

---

## Empfehlungen

### ✅ Empfehlung 1: PortResolutionStrategy als Dependency injizieren

**Grund:** Klarere Abhängigkeiten, einfachere Tests, bessere DI-Konformität.

```typescript
// Option B bevorzugen
PortSelector
  ├── FoundryVersionDetector (SINGLETON)
  ├── PortResolutionStrategy (SINGLETON) ← als Dependency
  ├── PortSelectionEventEmitter (TRANSIENT)
  └── ObservabilityRegistry (SINGLETON)
```

**Vorteile:**
- ✅ Explizite Dependencies
- ✅ Einfacher zu testen (Mock `PortResolutionStrategy`)
- ✅ Konsistent mit DI-Pattern
- ✅ Keine Zirkularität

---

### ✅ Empfehlung 2: FoundryVersionDetector als Singleton registrieren

**Grund:** Konsistenz mit anderen Services, einfachere Tests.

```typescript
// In registerPortInfrastructure()
container.registerClass(
  foundryVersionDetectorToken,
  DIFoundryVersionDetector,
  ServiceLifecycle.SINGLETON
);
```

**Vorteile:**
- ✅ Konsistent mit anderen Services
- ✅ Einfacher zu testen (Mock `FoundryVersionDetector`)
- ✅ Klare Registrierungsreihenfolge
- ✅ Keine Zirkularität

---

## Fazit

**✅ Keine zirkulären Abhängigkeiten erkannt**

Das Refactoring kann sicher durchgeführt werden:

1. ✅ `FoundryVersionDetector` hat keine Dependencies
2. ✅ `PortResolutionStrategy` benötigt nur `ServiceContainer`
3. ✅ `PortSelector` benötigt beide, aber keine Rückwärts-Abhängigkeiten
4. ✅ Registrierungsreihenfolge ist korrekt
5. ✅ Keine Zyklen im Abhängigkeitsgraph

**Nächste Schritte:**
1. Refactoring durchführen
2. Tests aktualisieren
3. Container-Validierung durchführen (prüft automatisch auf Zirkularität)

---

## Referenzen

- **Refactoring-Plan:** `docs/refactoring/SRP-REFACTORING-06-PORT-SELECTOR.md`
- **Zirkularitäts-Lösungen:** `docs/archive/CIRCULAR-DEPENDENCY-SOLUTIONS.md`
- **Aktuelle Implementierung:** `src/infrastructure/adapters/foundry/versioning/portselector.ts`
- **Version Detector:** `src/infrastructure/adapters/foundry/versioning/versiondetector.ts`
- **DI-Config:** `src/framework/config/dependencyconfig.ts`
- **Container-Validierung:** `src/infrastructure/di/validation/ContainerValidator.ts`

