---
ID: OCP-001
Prinzip: OCP
Schweregrad: Mittel
Module/Layer: framework/config
Status: Proposed
Reviewed: 2026-01-19
Relevance: still-relevant
Notes: `src/framework/config/modules/port-infrastructure.config.ts` still calls `registerV13Ports(...)` directly and suggests future hardcoded calls.
---

# 1. Problem

Die Port-Registrierung ist versionsspezifisch hardcodiert. Neue Foundry-Versionen erfordern Codeänderungen in `port-infrastructure.config.ts`, was OCP verletzt (Klasse/Funktion muss für Erweiterung offen sein, aber ohne Modifikation).

# 2. Evidence (Belege)

**Pfad & Knoten**
- `src/framework/config/modules/port-infrastructure.config.ts`

**Minimierter Codeauszug**
```ts
// src/framework/config/modules/port-infrastructure.config.ts
const v13RegistrationResult = registerV13Ports(...);
// Future: Add calls to registerV14Ports(), registerV15Ports(), etc. here
```

# 3. SOLID-Analyse

**OCP-Verstoß:** Jede neue Version erfordert eine Modifikation derselben Registrierungsfunktion. Das skaliert schlecht und erhöht Merge-Konflikte bei parallelen Feature-Arbeiten.

# 4. Zielbild

- Versionierte Port-Module registrieren sich selbst (Plugin-Registry).
- `createPortRegistries()` iteriert über eine Liste von Registrars (z. B. via DI oder Modul-Discovery).

# 5. Lösungsvorschlag

**Approach A (empfohlen)**
- Einführung eines `PortRegistrationPlugin`-Interfaces (z. B. `register(registries, container)` + `supportsVersion`).
- Port-Registrare werden in `infrastructure/adapters/foundry/ports` exportiert und zentral gesammelt.
- `createPortRegistries()` iteriert über registrierte Plugins (keine hardcodierte Version).

**Approach B (Alternative)**
- Konfigurationsgetrieben: `ports.config.ts` liefert Array von Registrars.

**Trade-offs:**
- A: dynamischer, aber verlangt Registry-Mechanismus.
- B: einfacher, aber Versionen müssen immer noch in Config ergänzt werden.

# 6. Refactoring-Schritte

1. Interface `PortRegistrar` definieren (version + register()).
2. `registerV13Ports` in `V13Registrar` kapseln.
3. `createPortRegistries()` iteriert über `registrars`.
4. Tests für Registrar-Discovery.

**Breaking Changes:**
- Registrierungspfad verändert (Bootstrap-Module müssen neuen Registrar einsetzen).

# 7. Beispiel-Code

**After**
```ts
const registrars: PortRegistrar[] = [new V13Registrar(), new V14Registrar()];
for (const registrar of registrars) {
  registrar.register(registries, container);
}
```

# 8. Tests & Quality Gates

- Unit-Tests für Registrar-Iteration.
- Regression-Test für PortRegistry-Population.

# 9. Akzeptanzkriterien

- Neue Foundry-Versionen lassen sich registrieren ohne Änderung an `createPortRegistries()`.
