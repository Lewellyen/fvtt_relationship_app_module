# Datenfluss-Diagramme

**Version:** 0.44.0
**Letzte Aktualisierung:** 2025-12-15

---

## 📖 Übersicht

Dieses Dokument visualisiert die wichtigsten Datenflüsse im Modul mittels Mermaid-Diagrammen. Die Diagramme zeigen die Interaktionen zwischen Schichten, Services und externen Systemen.

---

## 1. Bootstrap-Flow

Der vollständige Modul-Lifecycle vom Laden bis zur Aktivität:

```mermaid
flowchart TD
    subgraph Phase0["Phase 0: Module Load"]
        A[index.ts] --> B[Polyfills laden]
        B --> C[init-solid.ts importieren]
        C --> D[Styles laden]
    end

    subgraph Phase1["Phase 1: Eager Bootstrap"]
        D --> E[CompositionRoot.bootstrap]
        E --> F[ServiceContainer.createRoot]
        F --> G[configureDependencies]

        G --> G1[registerFallbacks]
        G --> G2[registerCoreServices]
        G --> G3[registerPortInfrastructure]
        G --> G4[registerFoundryServices]
        G --> G5[registerI18nServices]
        G --> G6[validateContainer]

        G6 --> H{Validation OK?}
        H -->|Nein| I[BootstrapErrorHandler]
        I --> J[UI Notification]
        J --> K[❌ Abort]

        H -->|Ja| L[Hook-Services registrieren]
    end

    subgraph Phase2["Phase 2: Foundry init Hook"]
        L --> M[Hooks.on init]
        M --> N[ModuleApiInitializer.expose]
        N --> O[game.modules.api ✓]
        O --> P[ModuleSettingsRegistrar]
        P --> Q[Logger konfigurieren]
        Q --> R[ModuleEventRegistrar]
    end

    subgraph Phase3["Phase 3: Foundry ready Hook"]
        R --> S[Hooks.on ready]
        S --> T[Logging & Light Actions]
        T --> U[✅ Module Active]
    end

    style Phase0 fill:#e1f5fe
    style Phase1 fill:#fff3e0
    style Phase2 fill:#e8f5e9
    style Phase3 fill:#f3e5f5
```

---

## 2. Service-Resolution-Flow

Wie Services über den DI-Container aufgelöst werden:

```mermaid
flowchart LR
    subgraph Aufruf["Service-Anfrage"]
        A[api.resolve token]
    end

    subgraph Container["ServiceContainer"]
        B{Token registriert?}
        C{Im Cache?}
        D[ServiceResolver]
        E[Dependencies auflösen]
        F[Instanz erstellen]
        G[Im Cache speichern]
    end

    subgraph Ergebnis["Ergebnis"]
        H[Service-Instanz]
        I[ContainerError]
    end

    A --> B
    B -->|Nein| I
    B -->|Ja| C
    C -->|Ja| H
    C -->|Nein| D
    D --> E
    E --> F
    F --> G
    G --> H

    style Aufruf fill:#e3f2fd
    style Container fill:#fff8e1
    style Ergebnis fill:#e8f5e9
```

---

## 3. Port-Selection-Flow (Lazy Loading)

Wie versionsspezifische Foundry-Ports ausgewählt werden:

```mermaid
flowchart TD
    subgraph Service["Foundry Service"]
        A[FoundryGameService]
        B[getPort aufrufen]
        C{Port cached?}
    end

    subgraph PortSelector["Port-Auswahl"]
        D[PortSelector.selectPort]
        E[game.version abfragen]
        F{Version ≥ 14?}
        G{Version ≥ 13?}
        H[FoundryGamePortV14]
        I[FoundryGamePortV13]
        J[❌ Keine kompatible Version]
    end

    subgraph Result["Ergebnis"]
        K[Port-Instanz cachen]
        L[Foundry API aufrufen]
    end

    A --> B
    B --> C
    C -->|Ja| L
    C -->|Nein| D
    D --> E
    E --> F
    F -->|Ja| H
    F -->|Nein| G
    G -->|Ja| I
    G -->|Nein| J
    H --> K
    I --> K
    K --> L

    style Service fill:#e8eaf6
    style PortSelector fill:#fff3e0
    style Result fill:#e8f5e9
```

---

## 4. Journal-Visibility-Flow

Wie Journal-Einträge versteckt/angezeigt werden:

```mermaid
flowchart TD
    subgraph Trigger["Trigger"]
        A[Foundry renderJournalDirectory Hook]
    end

    subgraph Service["JournalVisibilityService"]
        B[processJournalDirectory]
        C[getHiddenJournalEntries]
    end

    subgraph Facade["FoundryJournalFacade"]
        D[getJournalEntries]
    end

    subgraph Ports["Foundry Ports"]
        E[FoundryGameService]
        F[FoundryDocumentService]
        G[getFlag hidden]
    end

    subgraph DOM["DOM-Manipulation"]
        H[Versteckte Einträge filtern]
        I[CSS-Klassen setzen]
        J[HTML-Elemente ausblenden]
    end

    A --> B
    B --> C
    C --> D
    D --> E
    D --> F
    F --> G
    G --> H
    H --> I
    I --> J

    style Trigger fill:#ffebee
    style Service fill:#e3f2fd
    style Facade fill:#fff8e1
    style Ports fill:#e8f5e9
    style DOM fill:#f3e5f5
```

---

## 5. Result-Pattern-Flow

Wie Fehler durch die Schichten propagiert werden:

```mermaid
flowchart TD
    subgraph External["Externe API / User"]
        A[API-Aufruf]
        Z[Ergebnis verarbeiten]
    end

    subgraph Application["Application Layer"]
        B[Service-Methode]
        C{Operation erfolgreich?}
    end

    subgraph Domain["Domain Layer"]
        D[Business Logic]
        E{Validierung OK?}
    end

    subgraph Infrastructure["Infrastructure Layer"]
        F[Port/Adapter]
        G{Foundry-Aufruf OK?}
    end

    A --> B
    B --> D
    D --> E
    E -->|Nein| H[err DomainError]
    E -->|Ja| F
    F --> G
    G -->|Nein| I[err FoundryError]
    G -->|Ja| J[ok value]

    H --> C
    I --> C
    J --> C

    C -->|ok: true| K[Result.ok]
    C -->|ok: false| L[Result.err]

    K --> Z
    L --> Z

    style External fill:#e1f5fe
    style Application fill:#fff3e0
    style Domain fill:#e8f5e9
    style Infrastructure fill:#f3e5f5
```

---

## 6. Event-Flow (Observability)

Wie Events durch das System fließen:

```mermaid
flowchart LR
    subgraph Services["Observable Services"]
        A[PortSelector]
        B[CacheService]
        C[ServiceContainer]
    end

    subgraph EventEmitter["Event Emitter"]
        D[PortSelectionEventEmitter]
        E[emit event]
    end

    subgraph Registry["ObservabilityRegistry"]
        F[registerPortSelector]
        G[onEvent callback]
    end

    subgraph Observers["Observer-Aktionen"]
        H[Logger.debug]
        I[MetricsRecorder.record]
    end

    A --> D
    D --> E
    E --> G

    F --> G

    G --> H
    G --> I

    style Services fill:#e8eaf6
    style EventEmitter fill:#fff8e1
    style Registry fill:#e3f2fd
    style Observers fill:#e8f5e9
```

---

## 7. Schichten-Überblick

Die Clean Architecture Layer-Struktur:

```mermaid
flowchart TB
    subgraph Framework["Framework Layer"]
        direction TB
        F1[Bootstrap]
        F2[Config]
        F3[API Exposition]
    end

    subgraph Infrastructure["Infrastructure Layer"]
        direction TB
        I1[ServiceContainer]
        I2[Foundry Adapters]
        I3[Cache]
    end

    subgraph Application["Application Layer"]
        direction TB
        A1[Services]
        A2[Use Cases]
        A3[Settings]
    end

    subgraph Domain["Domain Layer"]
        direction TB
        D1[Entities]
        D2[Ports]
        D3[Types]
    end

    Framework --> Infrastructure
    Infrastructure --> Application
    Application --> Domain

    style Framework fill:#ffebee
    style Infrastructure fill:#fff3e0
    style Application fill:#e8f5e9
    style Domain fill:#e3f2fd
```

**Dependency-Regel:** Abhängigkeiten zeigen nur nach innen (unten). Domain hat keine externen Abhängigkeiten.

---

## 8. Notification-Flow

Wie Benachrichtigungen durch das System geroutet werden:

```mermaid
flowchart TD
    subgraph Input["Notification-Aufruf"]
        A[Service.notify]
        B[API: notifications.info]
    end

    subgraph Center["NotificationCenter"]
        C[Severity bestimmen]
        D[TraceId zuweisen]
        E{Channels iterieren}
    end

    subgraph Channels["Notification Channels"]
        F[ConsoleChannel]
        G[FoundryUIChannel]
        H[MetricsChannel]
    end

    subgraph Output["Ausgabe"]
        I[Console.log]
        J[ui.notifications.info]
        K[MetricsRecorder.record]
    end

    A --> C
    B --> C
    C --> D
    D --> E

    E --> F
    E --> G
    E --> H

    F --> I
    G --> J
    H --> K

    style Input fill:#e8eaf6
    style Center fill:#fff8e1
    style Channels fill:#e3f2fd
    style Output fill:#e8f5e9
```

---

## 9. Settings-Change-Flow

Wie Einstellungsänderungen propagiert werden:

```mermaid
flowchart TD
    subgraph User["Benutzer"]
        A[Foundry Settings UI]
    end

    subgraph Foundry["Foundry VTT"]
        B[Settings.set]
        C[onChange Callback]
    end

    subgraph Module["Modul"]
        D[RuntimeConfigService]
        E[notifyListeners]
        F[Logger.setMinLevel]
        G[Service-Rekonfiguration]
    end

    A --> B
    B --> C
    C --> D
    D --> E
    E --> F
    E --> G

    style User fill:#e1f5fe
    style Foundry fill:#fff3e0
    style Module fill:#e8f5e9
```

---

## 🔗 Siehe auch

- [Bootstrap-Prozess](./bootstrap.md) – Detaillierter Bootstrap-Ablauf
- [Architektur-Übersicht](./overview.md) – High-Level Architektur
- [Patterns](./patterns.md) – Port-Adapter, Result, DI
- [Modul-Grenzen](./module-boundaries.md) – Layer-Regeln

---

**Ende Datenfluss-Dokumentation**
