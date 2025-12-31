---
ID: SRP-001
Prinzip: SRP
Schweregrad: Mittel
Module/Layer: application/services
Status: Proposed
---

# 1. Problem

`RuntimeConfigSync` enthält sowohl die **Synchronisationslogik** als auch eine **konkrete Binding-Definition** (`runtimeConfigBindings`) inkl. Validatoren. Dadurch mischt die Datei Policies/Config mit Service-Logik (Single Responsibility verletzt) und erschwert Wiederverwendung/Tests.

# 2. Evidence (Belege)

**Pfad:** `src/application/services/RuntimeConfigSync.ts`

```ts
export class RuntimeConfigSync { /* ... sync logic ... */ }

const isLogLevel = (value: unknown): value is LogLevel => ...

export const runtimeConfigBindings = {
  [SETTING_KEYS.LOG_LEVEL]: { ... },
  [SETTING_KEYS.CACHE_ENABLED]: { ... },
  // ... weitere Bindings
} as const;
```

# 3. SOLID-Analyse

- **SRP-Verstoß:** Service-Implementierung + konkrete Policy/Bindings in einer Einheit.
- **Nebenwirkungen:** Jeder neue Binding erfordert Änderung der Service-Datei.
- **Folgeprobleme:** Erschwerte Tests (Service-Tests hängen an globalen Bindings).

# 4. Zielbild

- `RuntimeConfigSync` enthält ausschließlich Sync-Mechanik.
- Bindings liegen in separater Konfiguration/Registry (`application/config/runtime-config-bindings.ts`).

# 5. Lösungsvorschlag

**Approach A (empfohlen):**
- Bindings in `application/config/runtime-config-bindings.ts` auslagern.
- Registry-Interface einführen (`RuntimeConfigBindingRegistry`).

**Approach B (Alternative):**
- Bindings in `framework/config` definieren (kompositionell), Service bleibt generisch.

**Trade-offs:**
- Approach A ist näher an Application-Layer, Approach B reduziert App-Knowledge über konkrete Bindings.

# 6. Refactoring-Schritte

1. Neue Datei `application/config/runtime-config-bindings.ts` anlegen.
2. `runtimeConfigBindings` dorthin verschieben.
3. Optional: Registry-Interface + DI-Token anlegen.
4. Importstellen aktualisieren.

**Breaking Changes:**
- Importpfade für Bindings ändern sich.

# 7. Beispiel-Code

**Before**
```ts
export const runtimeConfigBindings = { ... };
```

**After**
```ts
// application/config/runtime-config-bindings.ts
export const runtimeConfigBindings = { ... };
```

# 8. Tests & Quality Gates

- Unit-Tests für `RuntimeConfigSync` ohne Bindings.
- Separate Tests für Binding-Registry.

# 9. Akzeptanzkriterien

- `RuntimeConfigSync.ts` enthält keine Binding-Definitionen.
- Bindings sind isoliert und unabhängig testbar.
