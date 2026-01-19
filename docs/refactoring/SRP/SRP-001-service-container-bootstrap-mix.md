---
ID: SRP-001
Prinzip: SRP
Schweregrad: Hoch
Module/Layer: infrastructure/di
Status: Proposed
Reviewed: 2026-01-19
Relevance: partially-addressed
Notes: `ServiceContainer` has internal manager components, but still contains bootstrap dependency creation (`createRoot`, `createBootstrapDependencies`).
---

# 1. Problem

`ServiceContainer` übernimmt neben DI-Kernaufgaben auch Bootstrap- und Observability-Aufgaben (RuntimeConfig/PerformanceTracker/Metric-Injection). Dadurch entsteht ein „God-Facade“-Knoten, der sich mit mehreren Änderungsgründen bewegt (DI-API, Bootstrap-Strategie, Observability). Das verletzt SRP und erschwert isolierte Tests sowie alternative Container-Backends.

# 2. Evidence (Belege)

**Pfade & Knoten**
- `src/infrastructure/di/container.ts` – `ServiceContainer` erstellt RuntimeConfig/PerformanceTracker im `createRoot()` und verdrahtet Metrics/ApiSecurity Manager im Konstruktor.

**Minimierte Codeauszüge**
```ts
// src/infrastructure/di/container.ts
static createRoot(env: EnvironmentConfig): ServiceContainer {
  const runtimeConfig = new RuntimeConfigAdapter(env);
  const performanceTracker = new BootstrapPerformanceTracker(runtimeConfig, null);
  const resolver = new ServiceResolver(..., performanceTracker);
  return new ServiceContainer(...);
}
```
```ts
// src/infrastructure/di/container.ts
private metricsInjectionManager: MetricsInjectionManager;
private apiSecurityManager: ApiSecurityManager;
```

# 3. SOLID-Analyse

**SRP-Verstoß:** `ServiceContainer` ist zugleich DI-Container, Bootstrap-Fabrik, Observability-Wiring und Security-Gate. Jede dieser Aufgaben kann unabhängig evolvieren (z. B. neue Bootstrap-Strategie oder Observability-Backend), erzwingt aber Änderungen am gleichen Kernobjekt.

**Nebenwirkungen:**
- Starke Kopplung an Infrastruktur-Details (RuntimeConfigAdapter, BootstrapPerformanceTracker).
- Testbarkeit leidet, da `createRoot()` nicht ohne Observability-Bausteine ausführbar ist.
- Erweiterung/Alternative Container-Implementierung wird erschwert.

# 4. Zielbild

- **Container-Core** ist für Registrierung/Resolution/Scopes zuständig.
- **Bootstrap/Observability** ist ausgelagert in separate Kompositionseinheiten.
- **Abhängigkeitsrichtung:** Framework/Bootstrap → Infrastructure/DI-Core (nicht umgekehrt).

```
framework/bootstrap
  └─ ContainerBootstrapper
        └─ ServiceContainer (DI-Core)
```

# 5. Lösungsvorschlag

**Approach A (empfohlen)**
- Extrahiere `ServiceContainerFactory` bzw. `ContainerBootstrapper`, der RuntimeConfig & PerformanceTracker zusammensetzt.
- `ServiceContainer` erhält nur DI-bezogene Abhängigkeiten (Registry, Resolver, ScopeManager, ValidationState).
- Metrics/ApiSecurity als optionales Decorator/Module registrieren.

**Approach B (Alternative)**
- Behalte `ServiceContainer`, aber verschiebe `createRoot` nach `ContainerBootstrapFactory` und injiziere `BootstrapContext`.

**Trade-offs:**
- A: Klarere Trennung, aber mehr Dateien/Boilerplate.
- B: Geringerer Umbau, aber Container bleibt „schwer“.

# 6. Refactoring-Schritte

1. `ContainerBootstrapper` (neu) erstellen, der RuntimeConfig/PerformanceTracker instanziiert.
2. `ServiceContainer.createRoot` entfernen oder delegieren.
3. `ServiceResolver` Konstruktion in Bootstrapper verschieben.
4. Metrics-/Security-Manager per DI-Module registrieren.
5. Tests für Container-Core isolieren (ohne Observability).

**Breaking Changes:**
- `ServiceContainer.createRoot` entfällt bzw. ist deprecated.
- Aufrufer müssen `ContainerBootstrapper.createRoot` verwenden.

# 7. Beispiel-Code

**Before**
```ts
const container = ServiceContainer.createRoot(env);
```

**After**
```ts
const container = ContainerBootstrapper.createRoot(env);
```

# 8. Tests & Quality Gates

- Unit-Tests für `ServiceContainer` ohne Observability-Abhängigkeiten.
- Integration-Tests für `ContainerBootstrapper` (PerformanceTracker/RuntimeConfig).
- Optional: Architektur-Lint (z. B. eslint-boundaries) für Layering-Regeln.

# 9. Akzeptanzkriterien

- `ServiceContainer` konstruiert keine RuntimeConfig/PerformanceTracker.
- Bootstrap-Logik liegt ausschließlich im Bootstrap-Modul.
- DI-Core bleibt ohne Knowledge über Observability/Performance.
