# Schichten & Abhängigkeitsprüfung

```mermaid
graph TD
  Core[Core Layer\n(init-solid.ts, composition-root.ts)] --> Config[Configuration Layer\n(dependencyconfig.ts)]
  Config --> DI[DI Infrastructure Layer\n(ServiceContainer, Tokens)]
  DI --> Foundry[Foundry Adapter Layer\n(versiondetector, translation handlers, ports)]
  Foundry --> FoundryAPI[Foundry VTT API]
```

## Schichten & Artefakte
- **Core Layer:** Bootstrapping und Hook-Orchestrierung über `init-solid.ts` und die DI-Bootstrap-Logik in `composition-root.ts`. Verantwortlich für Container-Aufbau und Hook-Registrierung.【F:src/framework/core/init-solid.ts†L16-L147】【F:src/framework/core/composition-root.ts†L28-L80】
- **Configuration Layer:** DI-Registrierung erfolgt über `dependencyconfig.ts` (laut Architekturübersicht) und bleibt versionsagnostisch.【F:ARCHITECTURE.md†L27-L65】
- **DI Infrastructure Layer:** Umsetzung der Container-Funktionalität (Registrierung, Auflösung, Scopes) in `ServiceContainer` und begleitenden Komponenten.【F:src/infrastructure/di/container.ts†L1-L125】
- **Foundry Adapter Layer:** Plattform-spezifische Ports/Handler wie der Versionsdetektor und die I18n-Handler-Kette, die Foundry-APIs kapseln.【F:src/framework/core/init-solid.ts†L55-L147】【F:src/infrastructure/i18n/TranslationHandlerChain.ts†L12-L35】

## Abhängigkeitsbewertung
- **Core → Config/DI:** Core nutzt den konkreten `ServiceContainer` direkt. Das funktioniert, koppelt aber das Layer an die Implementierung; ein abstrahiertes Container-Port würde die Schichtentkopplung stärken (siehe DIP-Analyse).【F:src/framework/core/init-solid.ts†L32-L147】
- **Config → DI:** Laut Architektur bleibt die Konfiguration versionsagnostisch und verweist nur auf Registrierungsfunktionen; keine direkten Foundry-Abhängigkeiten erkennbar.【F:ARCHITECTURE.md†L27-L138】
- **DI → Adapter:** Adapters werden über Tokens/Registrierungen eingebunden; innerhalb der betrachteten Dateien sind keine Rückkopplungen in Core/Domain sichtbar.【F:src/infrastructure/i18n/TranslationHandlerChain.ts†L12-L35】

## Empfehlungen
- Führe ein `ContainerPort`-Interface ein, das Core konsumiert, um die derzeitige Kopplung an `ServiceContainer` zu lösen.
- Dokumentiere im Config-Layer explizit, welche Adapter pro Foundry-Version registriert sind, und decke die Layer-Grenzen mit Dependency-Tests (z. B. verbotene Imports) ab.
