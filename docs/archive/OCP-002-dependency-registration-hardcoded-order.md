---
id: OCP-002
principle: OCP
severity: medium
layer: Framework (dependency configuration)
status: Proposed
---

1. Problem

Die Liste der Dependency-Registration-Schritte ist in
createDependencyRegistrationRegistry() hard-coded. Neue Module muessen diese
Funktion direkt aendern. Das verhindert echte Erweiterbarkeit (Plugin-Style)
und kollidiert mit OCP.

2. Evidence (Belege)

- Pfad: src/framework/config/dependencyconfig.ts:120-165
- Konkrete Belege:

```ts
function createDependencyRegistrationRegistry(): DependencyRegistrationRegistry {
  const registry = new DependencyRegistrationRegistry();
  registry.register({ name: "CoreServices", priority: 20, execute: registerCoreServices });
  registry.register({ name: "Observability", priority: 30, execute: registerObservability });
  ...
  registry.register({ name: "CacheConfigSyncInit", priority: 190, execute: initializeCacheConfigSync });
  return registry;
}
```

3. SOLID-Analyse

OCP-Verstoss: Erweiterungen erfordern Code-Aenderungen am zentralen
Konfigurationspunkt. Dadurch entstehen Merge-Konflikte und
Reihenfolgen-Fehler, sobald neue Module hinzukommen.

4. Zielbild

- Registrierungsschritte sind extern erweiterbar (Registry-Plugin).
- Reihenfolge wird ueber deklarative Prioritaeten gesteuert.
- Framework-Kern muss fuer neue Module nicht angepasst werden.

5. Loesungsvorschlag

Approach A (empfohlen)
- Exponiere eine Registry-Instanz und ein API wie `registerDependencyStep()`.
- Module registrieren sich selbst in ihrem Config-File.

Approach B (Alternative)
- DependencyConfigurator akzeptiert eine Liste/Map an Steps, die von außen
  (z.B. in framework/index.ts) zusammengestellt wird.

Trade-offs
- Globale Registry erfordert saubere Initialisierung/Import-Reihenfolge.

6. Refactoring-Schritte

1) Registry-API exportieren (z.B. src/framework/config/dependency-registry.ts).
2) createDependencyRegistrationRegistry() auf Default-Registration reduzieren.
3) Module registrieren ihren Step direkt bei Import.
4) Tests fuer Reihenfolge/Phasen anpassen.

7. Beispiel-Code

After
```ts
// dependency-registry.ts
export const dependencyRegistry = new DependencyRegistrationRegistry();
export function registerDependencyStep(step: DependencyRegistrationStep) {
  dependencyRegistry.register(step);
}
```

8. Tests & Quality Gates

- Unit-Tests fuer Registry-Order (Prioritaeten, stabile Reihenfolge).
- Integration-Test: Bootstrap mit custom steps.

9. Akzeptanzkriterien

- Neue Module koennen Steps registrieren ohne Aenderung an dependencyconfig.ts.
- Reihenfolge ist deterministic und getestet.
