# Event-System Hierarchie: Generalisierung & Spezialisierung

**Datum:** 2025-01-27  
**Status:** Konzept-Dokumentation

---

## 📋 Übersicht

Das Event-System verwendet eine **Hierarchie aus Generalisierung und Spezialisierung**, um sowohl generische als auch spezialisierte Event-Behandlung zu ermöglichen. Dies erlaubt:

- **Generalisierung**: `PlatformEventPort<TEvent>` für alle möglichen Event-Typen
- **Spezialisierung**: `PlatformJournalEventPort` für Journal-spezifische Events
- **Platform-Adapter**: `FoundryHooksPort` für Foundry-spezifische Hook-Behandlung
- **Version-Adapter**: `FoundryV13HooksPort` für v13-spezifische Implementierung

---

## 🏗️ Architektur-Hierarchie

### Gesamtübersicht

```mermaid
graph TB
    subgraph "Domain Layer - Platform-Agnostisch"
        A["`**PlatformEventPort&lt;TEvent&gt;**<br/>Generisches Event-Interface<br/>registerListener()<br/>unregisterListener()`"]
        A1["`**PlatformJournalEventPort**<br/>Spezialisiert für Journal-Events<br/>onJournalCreated()<br/>onJournalUpdated()<br/>onJournalDeleted()`"]
        A1 -.extends.-> A
    end
    
    subgraph "Infrastructure Layer - Foundry-Adapter"
        B["`**FoundryHooksPort**<br/>Foundry-spezifischer Adapter<br/>Implementiert PlatformEventPort<br/>on(), off(), once()`"]
        B -.implements.-> A
        B1["`**FoundryV13HooksPort**<br/>v13-spezifische Implementierung<br/>Direkter Zugriff auf Hooks API`"]
        B1 -.implements.-> B
    end
    
    subgraph "Infrastructure Layer - Domain-Adapter"
        C["`**FoundryJournalEventAdapter**<br/>Journal-Event Adapter<br/>Implementiert PlatformJournalEventPort<br/>Nutzt FoundryHooksPort`"]
        C -.implements.-> A1
        C -.uses.-> B
    end
    
    subgraph "Foundry API - Extern"
        D["`**Hooks API**<br/>Hooks.on()<br/>Hooks.off()<br/>Hooks.once()`"]
        B1 --> D
    end
    
    style A fill:#90EE90,stroke:#006400,stroke-width:3px,color:#000000
    style A1 fill:#90EE90,stroke:#006400,stroke-width:3px,color:#000000
    style B fill:#87CEEB,stroke:#0066CC,stroke-width:3px,color:#000000
    style B1 fill:#87CEEB,stroke:#0066CC,stroke-width:3px,color:#000000
    style C fill:#FFE4B5,stroke:#CC6600,stroke-width:3px,color:#000000
    style D fill:#FFB6C1,stroke:#CC0000,stroke-width:3px,color:#000000
```

---

## 🔄 Dependency Chain

### Korrekte Abhängigkeitskette

```mermaid
graph LR
    subgraph "Application Layer"
        APP["`**Application Services**<br/>Use Cases<br/>Handlers`"]
    end
    
    subgraph "Domain Layer - Platform Ports"
        PLAT["`**PlatformEventPort**<br/>PlatformJournalEventPort`"]
    end
    
    subgraph "Infrastructure Layer - Foundry Ports"
        FOUNDRY["`**FoundryHooksPort**<br/>Version-agnostic`"]
    end
    
    subgraph "Infrastructure Layer - Version Ports"
        VERSION["`**FoundryV13HooksPort**<br/>v13-specific`"]
    end
    
    subgraph "External API"
        API["`**Foundry Hooks API**<br/>Hooks.on/off/once`"]
    end
    
    APP -->|"nutzt"| PLAT
    PLAT -->|"implementiert durch"| FOUNDRY
    FOUNDRY -->|"delegiert an"| VERSION
    VERSION -->|"ruft auf"| API
    
    style APP fill:#FFE4E1,stroke:#8B0000,stroke-width:2px,color:#000000
    style PLAT fill:#90EE90,stroke:#006400,stroke-width:2px,color:#000000
    style FOUNDRY fill:#87CEEB,stroke:#0066CC,stroke-width:2px,color:#000000
    style VERSION fill:#87CEEB,stroke:#0066CC,stroke-width:2px,color:#000000
    style API fill:#FFB6C1,stroke:#CC0000,stroke-width:2px,color:#000000
```

---

## 📊 Klassendiagramm

### Detaillierte Interface/Class-Hierarchie

```mermaid
classDiagram
    class PlatformEventPort~TEvent~ {
        <<interface>>
        +registerListener(eventType: string, callback: Function) Result~EventRegistrationId, PlatformEventError~
        +unregisterListener(registrationId: EventRegistrationId) Result~void, PlatformEventError~
    }
    
    class PlatformJournalEventPort {
        <<interface>>
        +onJournalCreated(callback: Function) Result~EventRegistrationId, PlatformEventError~
        +onJournalUpdated(callback: Function) Result
        +onJournalDeleted(callback: Function) Result
        +onJournalDirectoryRendered(callback: Function) Result
        +onJournalContextMenu(callback: Function) Result
    }
    
    class FoundryHooksPort {
        <<class>>
        -portSelector: PortSelector
        -portRegistry: PortRegistry~FoundryHooks~
        +registerListener(eventType: string, callback: Function) Result
        +unregisterListener(registrationId: EventRegistrationId) Result
        +on(hookName: string, callback: Function) Result~number, FoundryError~
        +off(hookName: string, callbackOrId: Function|number) Result
        +once(hookName: string, callback: Function) Result
    }
    
    class FoundryV13HooksPort {
        <<class>>
        +on(hookName: string, callback: Function) Result~number, FoundryError~
        +off(hookName: string, callbackOrId: Function|number) Result
        +once(hookName: string, callback: Function) Result
    }
    
    class FoundryJournalEventAdapter {
        <<class>>
        -foundryHooksPort: FoundryHooksPort
        +onJournalCreated(callback: Function) Result
        +onJournalUpdated(callback: Function) Result
        +onJournalDeleted(callback: Function) Result
        +onJournalDirectoryRendered(callback: Function) Result
        +onJournalContextMenu(callback: Function) Result
        +registerListener(eventType: string, callback: Function) Result
        +unregisterListener(registrationId: EventRegistrationId) Result
    }
    
    PlatformEventPort~TEvent~ <|.. PlatformJournalEventPort : extends
    PlatformEventPort~unknown~ <|.. FoundryHooksPort : implements
    FoundryHooksPort <|.. FoundryV13HooksPort : implements
    PlatformJournalEventPort <|.. FoundryJournalEventAdapter : implements
    FoundryHooksPort <.. FoundryJournalEventAdapter : uses
    
    style PlatformEventPort fill:#90EE90,stroke:#006400,stroke-width:2px,color:#000000
    style PlatformJournalEventPort fill:#90EE90,stroke:#006400,stroke-width:2px,color:#000000
    style FoundryHooksPort fill:#87CEEB,stroke:#0066CC,stroke-width:2px,color:#000000
    style FoundryV13HooksPort fill:#87CEEB,stroke:#0066CC,stroke-width:2px,color:#000000
    style FoundryJournalEventAdapter fill:#FFE4B5,stroke:#CC6600,stroke-width:2px,color:#000000
```

---

## 🔀 Generalisierung & Spezialisierung

### Generalisierung: PlatformEventPort

```mermaid
graph TD
    A["`**PlatformEventPort&lt;TEvent&gt;**<br/><br/>**Generisch für alle Event-Typen**<br/><br/>- registerListener()<br/>- unregisterListener()<br/><br/>**Verwendbar für:**<br/>- Journal Events<br/>- Actor Events<br/>- Item Events<br/>- Custom Events`"]
    
    A1["`**PlatformJournalEventPort**<br/>Spezialisiert für Journal`"]
    A2["`**PlatformActorEventPort**<br/>Spezialisiert für Actors<br/>(Zukunft)`"]
    A3["`**PlatformItemEventPort**<br/>Spezialisiert für Items<br/>(Zukunft)`"]
    
    A -->|"kann erweitert werden zu"| A1
    A -->|"kann erweitert werden zu"| A2
    A -->|"kann erweitert werden zu"| A3
    
    style A fill:#90EE90,stroke:#006400,stroke-width:3px,color:#000000
    style A1 fill:#90EE90,stroke:#006400,stroke-width:2px,color:#000000
    style A2 fill:#D3D3D3,stroke:#666666,stroke-width:2px,color:#000000
    style A3 fill:#D3D3D3,stroke:#666666,stroke-width:2px,color:#000000
```

### Spezialisierung: PlatformJournalEventPort

```mermaid
graph TD
    A["`**PlatformEventPort&lt;JournalEvent&gt;**<br/>Generische Methoden`"]
    B["`**PlatformJournalEventPort**<br/>Spezialisierte Methoden`"]
    
    A -->|"erweitert"| B
    
    B1["`onJournalCreated()<br/>Spezifisch für Journal Creation`"]
    B2["`onJournalUpdated()<br/>Spezifisch für Journal Updates`"]
    B3["`onJournalDeleted()<br/>Spezifisch für Journal Deletion`"]
    B4["`onJournalDirectoryRendered()<br/>Spezifisch für UI Rendering`"]
    B5["`onJournalContextMenu()<br/>Spezifisch für Context Menu`"]
    
    B --> B1
    B --> B2
    B --> B3
    B --> B4
    B --> B5
    
    style A fill:#90EE90,stroke:#006400,stroke-width:2px,color:#000000
    style B fill:#90EE90,stroke:#006400,stroke-width:3px,color:#000000
    style B1 fill:#E6FFE6,stroke:#006400,stroke-width:1px,color:#000000
    style B2 fill:#E6FFE6,stroke:#006400,stroke-width:1px,color:#000000
    style B3 fill:#E6FFE6,stroke:#006400,stroke-width:1px,color:#000000
    style B4 fill:#E6FFE6,stroke:#006400,stroke-width:1px,color:#000000
    style B5 fill:#E6FFE6,stroke:#006400,stroke-width:1px,color:#000000
```

---

## 🔗 Implementierungs-Kette

### Foundry-Adapter-Implementierung

```mermaid
graph TB
    subgraph "Domain Interface"
        PI["`**PlatformEventPort&lt;unknown&gt;**<br/>registerListener()<br/>unregisterListener()`"]
    end
    
    subgraph "Foundry Service Layer"
        FH["`**FoundryHooksPort**<br/>Implementiert PlatformEventPort<br/>+ FoundryHooks Interface<br/><br/>registerListener() → on()<br/>unregisterListener() → off()`"]
        FH -.implements.-> PI
    end
    
    subgraph "Version Layer"
        FV13["`**FoundryV13HooksPort**<br/>Implementiert FoundryHooks<br/><br/>on() → Hooks.on()<br/>off() → Hooks.off()<br/>once() → Hooks.once()`"]
        FV13 -.implements.-> FH
    end
    
    subgraph "Foundry API"
        HOOKS["`**Hooks API**<br/>Global Foundry Object`"]
        FV13 --> HOOKS
    end
    
    style PI fill:#90EE90,stroke:#006400,stroke-width:2px,color:#000000
    style FH fill:#87CEEB,stroke:#0066CC,stroke-width:2px,color:#000000
    style FV13 fill:#87CEEB,stroke:#0066CC,stroke-width:2px,color:#000000
    style HOOKS fill:#FFB6C1,stroke:#CC0000,stroke-width:2px,color:#000000
```

### Journal-Event-Adapter-Implementierung

```mermaid
graph TB
    subgraph "Domain Interface"
        PJ["`**PlatformJournalEventPort**<br/>onJournalCreated()<br/>onJournalUpdated()<br/>onJournalDeleted()<br/>onJournalDirectoryRendered()<br/>onJournalContextMenu()`"]
    end
    
    subgraph "Foundry Adapter"
        FJA["`**FoundryJournalEventAdapter**<br/>Implementiert PlatformJournalEventPort<br/><br/>Mappt Journal-Events zu<br/>Foundry Hooks`"]
        FJA -.implements.-> PJ
    end
    
    subgraph "Foundry Service"
        FH["`**FoundryHooksPort**<br/>registerListener()<br/>unregisterListener()`"]
        FJA -.uses.-> FH
    end
    
    subgraph "Version Layer"
        FV13["`**FoundryV13HooksPort**<br/>on(), off(), once()`"]
        FH -.delegates to.-> FV13
    end
    
    style PJ fill:#90EE90,stroke:#006400,stroke-width:2px,color:#000000
    style FJA fill:#FFE4B5,stroke:#CC6600,stroke-width:2px,color:#000000
    style FH fill:#87CEEB,stroke:#0066CC,stroke-width:2px,color:#000000
    style FV13 fill:#87CEEB,stroke:#0066CC,stroke-width:2px,color:#000000
```

---

## 💡 Verwendungsbeispiele

### Beispiel 1: Generischer Event-Port

```mermaid
sequenceDiagram
    participant App as Application Service
    participant PEP as PlatformEventPort
    participant FHP as FoundryHooksPort
    participant FV13 as FoundryV13HooksPort
    participant Hooks as Hooks API
    
    App->>PEP: registerListener("customEvent", callback)
    PEP->>FHP: registerListener("customEvent", callback)
    FHP->>FHP: on("customEvent", callback)
    FHP->>FV13: on("customEvent", callback)
    FV13->>Hooks: Hooks.on("customEvent", callback)
    Hooks-->>FV13: hookId
    FV13-->>FHP: Result(ok, hookId)
    FHP-->>PEP: Result(ok, hookId)
    PEP-->>App: Result(ok, hookId)
```

### Beispiel 2: Spezialisierter Journal-Event-Port

```mermaid
sequenceDiagram
    participant App as Application Service
    participant PJEP as PlatformJournalEventPort
    participant FJEA as FoundryJournalEventAdapter
    participant FHP as FoundryHooksPort
    participant FV13 as FoundryV13HooksPort
    participant Hooks as Hooks API
    
    App->>PJEP: onJournalCreated(callback)
    PJEP->>FJEA: onJournalCreated(callback)
    FJEA->>FJEA: Mappe zu "createJournalEntry"
    FJEA->>FHP: registerListener("createJournalEntry", mappedCallback)
    FHP->>FHP: on("createJournalEntry", mappedCallback)
    FHP->>FV13: on("createJournalEntry", mappedCallback)
    FV13->>Hooks: Hooks.on("createJournalEntry", mappedCallback)
    Hooks-->>FV13: hookId
    FV13-->>FHP: Result(ok, hookId)
    FHP-->>FJEA: Result(ok, hookId)
    FJEA-->>PJEP: Result(ok, hookId)
    PJEP-->>App: Result(ok, hookId)
```

---

## 🎯 Vorteile dieser Architektur

### 1. **Generalisierung**
- `PlatformEventPort<TEvent>` kann für **alle** Event-Typen verwendet werden
- Nicht nur Journal-Events, sondern auch Actor-Events, Item-Events, Custom-Events, etc.

### 2. **Spezialisierung**
- `PlatformJournalEventPort` bietet **typsichere, spezialisierte Methoden**
- Bessere API für Journal-spezifische Use Cases
- Kompiliertzeit-Typsicherheit für Journal-Events

### 3. **Wiederverwendbarkeit**
- `FoundryHooksPort` kann für **alle** Foundry-Hooks verwendet werden
- Nicht nur Journal-Hooks, sondern auch Actor-Hooks, Item-Hooks, etc.

### 4. **Klare Dependency Chain**
```
Application → Platform-Port → Foundry-Port → Version-Port → Foundry API
```

### 5. **Erweiterbarkeit**
- Neue spezialisierte Ports können einfach hinzugefügt werden
- Beispiel: `PlatformActorEventPort`, `PlatformItemEventPort`, etc.

---

## 📝 Code-Beispiele

### Generischer Event-Port

```typescript
// Application Layer
class MyUseCase {
  constructor(
    private readonly eventPort: PlatformEventPort<MyEvent> // Generisch
  ) {}
  
  register(): Result<void, Error> {
    const result = this.eventPort.registerListener("myEvent", (event) => {
      console.log("Event received:", event);
    });
    return result.ok ? ok(undefined) : err(new Error(result.error.message));
  }
}
```

### Spezialisierter Journal-Event-Port

```typescript
// Application Layer
class JournalUseCase {
  constructor(
    private readonly journalEvents: PlatformJournalEventPort // Spezialisiert
  ) {}
  
  register(): Result<void, Error> {
    const result = this.journalEvents.onJournalCreated((event) => {
      console.log("Journal created:", event.journalId);
    });
    return result.ok ? ok(undefined) : err(new Error(result.error.message));
  }
}
```

### FoundryHooksPort als PlatformEventPort

```typescript
// Infrastructure Layer
export class FoundryHooksPort 
  extends FoundryServiceBase<FoundryHooks> 
  implements FoundryHooks, PlatformEventPort<unknown> {
  
  // FoundryHooks-Interface
  on(hookName: string, callback: FoundryHookCallback): Result<number, FoundryError> { ... }
  off(...): Result<void, FoundryError> { ... }
  once(...): Result<number, FoundryError> { ... }
  
  // PlatformEventPort-Interface
  registerListener(
    eventType: string, 
    callback: (event: unknown) => void
  ): Result<EventRegistrationId, PlatformEventError> {
    const result = this.on(eventType, callback as FoundryHookCallback);
    if (!result.ok) {
      return err({
        code: "EVENT_REGISTRATION_FAILED",
        message: result.error.message,
        details: result.error
      });
    }
    return ok(result.value);
  }
  
  unregisterListener(registrationId: EventRegistrationId): Result<void, PlatformEventError> {
    // Implementation benötigt Hook-Name-Tracking
    // Oder: ID-basierte Unregistration über erweiterte Registry
    return err({
      code: "EVENT_UNREGISTRATION_FAILED",
      message: "Hook name required for unregistration"
    });
  }
}
```

---

## 🔄 Migration-Plan

### Schritt 1: FoundryHooksPort erweitern
- `PlatformEventPort<unknown>` Interface implementieren
- `registerListener()` und `unregisterListener()` Methoden hinzufügen
- Bestehende `on()`, `off()`, `once()` Methoden beibehalten

### Schritt 2: FoundryJournalEventAdapter anpassen
- `FoundryHooks` durch `FoundryHooksPort` ersetzen
- `registerListener()` und `unregisterListener()` delegieren an `FoundryHooksPort`

### Schritt 3: Application Layer refactoren
- `init-solid.ts`: `Hooks.on()` durch `PlatformEventPort.registerListener()` ersetzen
- Alle direkten `Hooks`-Zugriffe durch Platform-Port ersetzen

---

## 📚 Verwandte Dokumentation

- [ARCHITECTURE.md](../../ARCHITECTURE.md) - Gesamtarchitektur
- [Port-Adapter-Pattern](../../ARCHITECTURE.md#port-adapter-pattern) - Port-Pattern-Details
- [Event System Refactoring](../refactoring/phases/phase-1-event-system-refactoring.md) - Event-System-Refactoring

---

## ✅ Zusammenfassung

Die Hierarchie ermöglicht:

1. **Generalisierung**: `PlatformEventPort<TEvent>` für alle Event-Typen
2. **Spezialisierung**: `PlatformJournalEventPort` für Journal-spezifische Events
3. **Platform-Adapter**: `FoundryHooksPort` implementiert `PlatformEventPort` für Foundry
4. **Version-Adapter**: `FoundryV13HooksPort` implementiert `FoundryHooks` für v13
5. **Domain-Adapter**: `FoundryJournalEventAdapter` nutzt `FoundryHooksPort` für Journal-Events

Diese Architektur erfüllt die **Dependency Chain Rule**: Alle chain-externen Zugriffe gehen über Platform-Ports, nicht direkt auf Foundry-APIs.

